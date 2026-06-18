#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "simulator.h"

#define TICK_SECONDS 30.0

static const char *CAR_MAKES[] = {"Toyota", "Skoda", "Volkswagen", "BMW", "Audi", "Ford", "Renault", "Kia"};
static const char *CAR_MODELS[] = {"Corolla", "Octavia", "Golf", "320", "A4", "Focus", "Clio", "Ceed"};
static const char *CAR_COLORS[] = {"White", "Black", "Silver", "Blue", "Red", "Gray"};

static void create_plate(int trip_id, char *out_plate, size_t size)
{
  static const char *prefixes[] = {"WX", "PO", "KR", "LU", "KT", "GD", "WR"};
  const char *prefix = prefixes[trip_id % (int)(sizeof(prefixes) / sizeof(prefixes[0]))];
  snprintf(out_plate, size, "%s%04d", prefix, 1000 + trip_id);
}

static int random_range(int max_exclusive)
{
  if (max_exclusive <= 0) {
    return 0;
  }
  return rand() % max_exclusive;
}

static double road_speed_limit_kmh(const char *road_code)
{
  if (!road_code) return 130.0;
  if (strcmp(road_code, "A8") == 0) return 120.0;
  if (strcmp(road_code, "A6") == 0) return 120.0;
  return 140.0;
}

static void push_alert(
  SimulationState *state,
  const char *type,
  const char *severity,
  const char *message,
  const Trip *vehicle,
  const char *camera_id,
  double measured_speed_kmh,
  const char *route
)
{
  int idx;
  AlertEvent *a;
  if (!state) {
    return;
  }

  if (state->alert_count < MAX_ALERTS) {
    idx = state->alert_count++;
  } else {
    memmove(&state->alerts[0], &state->alerts[1], (MAX_ALERTS - 1) * sizeof(AlertEvent));
    idx = MAX_ALERTS - 1;
  }

  a = &state->alerts[idx];
  memset(a, 0, sizeof(*a));
  a->tick = state->tick;
  snprintf(a->type, sizeof(a->type), "%s", type ? type : "warning");
  snprintf(a->severity, sizeof(a->severity), "%s", severity ? severity : "warning");
  snprintf(a->message, sizeof(a->message), "%s", message ? message : "");
  if (vehicle) {
    snprintf(a->vehicle_a, sizeof(a->vehicle_a), "%s", vehicle->plate);
    snprintf(a->make, sizeof(a->make), "%s", vehicle->make);
    snprintf(a->model, sizeof(a->model), "%s", vehicle->model);
    snprintf(a->color, sizeof(a->color), "%s", vehicle->color);
    a->speed_limit_kmh = vehicle->speed_limit_kmh;
  }
  snprintf(a->camera_id, sizeof(a->camera_id), "%s", camera_id ? camera_id : "CAM-UNKNOWN");
  a->measured_speed_kmh = measured_speed_kmh;
  snprintf(a->route, sizeof(a->route), "%s", route ? route : "");
}

static double estimate_speed_kmh(const Trip *trip)
{
  double elapsed_ticks;
  double elapsed_hours;
  double progressed_km;

  if (!trip || trip->total_ticks <= 0) {
    return 0.0;
  }

  elapsed_ticks = (double)(trip->total_ticks - trip->ticks_left);
  if (elapsed_ticks < 1.0) {
    elapsed_ticks = 1.0;
  }

  elapsed_hours = (elapsed_ticks * TICK_SECONDS) / 3600.0;
  progressed_km = ((double)trip->distance_km) * (elapsed_ticks / (double)trip->total_ticks);
  if (elapsed_hours <= 0.0) {
    return 0.0;
  }

  return progressed_km / elapsed_hours;
}

void simulation_init(SimulationState *state)
{
  if (!state) {
    return;
  }
  memset(state, 0, sizeof(*state));
  state->next_trip_id = 1;
}

static int spawn_trip(const Network *network, SimulationState *state)
{
  Trip candidate;
  char road_codes[32][MAX_ROAD_CODE_LEN];
  int road_count = 0;
  char selected_road[MAX_ROAD_CODE_LEN];
  Trip *trip;
  int slot = -1;
  int i;

  memset(road_codes, 0, sizeof(road_codes));
  memset(selected_road, 0, sizeof(selected_road));

  for (i = 0; i < MAX_ACTIVE_TRIPS; i++) {
    if (!state->trips[i].active) {
      slot = i;
      break;
    }
  }
  if (slot < 0) {
    return 1;
  }

  memset(&candidate, 0, sizeof(candidate));
  candidate.active = 1;
  candidate.trip_id = state->next_trip_id;
  candidate.entry_tick = state->tick;

  for (i = 0; i < network->entry_count; i++) {
    int e;
    int has_exit = 0;
    int exists = 0;
    for (e = 0; e < network->exit_count; e++) {
      if (strcmp(network->entries[i].road_code, network->exits[e].road_code) == 0) {
        has_exit = 1;
        break;
      }
    }
    if (!has_exit) continue;

    for (e = 0; e < road_count; e++) {
      if (strcmp(road_codes[e], network->entries[i].road_code) == 0) {
        exists = 1;
        break;
      }
    }
    if (!exists && road_count < (int)(sizeof(road_codes) / sizeof(road_codes[0]))) {
      snprintf(road_codes[road_count], sizeof(road_codes[road_count]), "%s", network->entries[i].road_code);
      road_count++;
    }
  }

  if (road_count == 0) {
    return 1;
  }

  snprintf(selected_road, sizeof(selected_road), "%s", road_codes[random_range(road_count)]);
  snprintf(candidate.road_code, sizeof(candidate.road_code), "%s", selected_road);

  {
    int entry_candidates[MAX_GATES];
    int exit_candidates[MAX_GATES];
    int entry_n = 0;
    int exit_n = 0;
    int tries = 0;

    for (i = 0; i < network->entry_count; i++) {
      if (strcmp(network->entries[i].road_code, selected_road) == 0) entry_candidates[entry_n++] = i;
    }
    for (i = 0; i < network->exit_count; i++) {
      if (strcmp(network->exits[i].road_code, selected_road) == 0) exit_candidates[exit_n++] = i;
    }
    if (entry_n == 0 || exit_n == 0) return 1;

    do {
      candidate.entry_index = entry_candidates[random_range(entry_n)];
      candidate.exit_index = exit_candidates[random_range(exit_n)];
      candidate.distance_km = abs(network->exits[candidate.exit_index].km - network->entries[candidate.entry_index].km);
      tries++;
    } while (candidate.distance_km < 10 && tries < 12);
  }

  if (candidate.distance_km < 10) candidate.distance_km = 10;

  {
    const double ticks_per_km = 0.35;
    const int base_ticks = 8;
    int scaled_ticks = base_ticks + (int)(candidate.distance_km * ticks_per_km);
    if (scaled_ticks < 12) scaled_ticks = 12;
    candidate.total_ticks = scaled_ticks;
    candidate.ticks_left = scaled_ticks;
  }

  candidate.speed_limit_kmh = road_speed_limit_kmh(candidate.road_code);
  candidate.expected_toll = candidate.distance_km * network->price_per_km;
  create_plate(candidate.trip_id, candidate.plate, sizeof(candidate.plate));
  snprintf(candidate.make, sizeof(candidate.make), "%s", CAR_MAKES[random_range((int)(sizeof(CAR_MAKES)/sizeof(CAR_MAKES[0])))]);
  snprintf(candidate.model, sizeof(candidate.model), "%s", CAR_MODELS[random_range((int)(sizeof(CAR_MODELS)/sizeof(CAR_MODELS[0])))]);
  snprintf(candidate.color, sizeof(candidate.color), "%s", CAR_COLORS[random_range((int)(sizeof(CAR_COLORS)/sizeof(CAR_COLORS[0])))]);

  trip = &state->trips[slot];
  *trip = candidate;
  state->next_trip_id++;
  state->active_trip_count++;
  return 0;
}

static void monitor_trip_behavior(const Network *network, SimulationState *state, Trip *trip)
{
  char route[48];
  char camera[32];
  char message[256];
  double speed_kmh;
  int elapsed_ticks;

  if (!trip || !trip->active) return;

  snprintf(route, sizeof(route), "%s:%s->%s",
    trip->road_code,
    network->entries[trip->entry_index].id,
    network->exits[trip->exit_index].id);

  elapsed_ticks = state->tick - trip->entry_tick;
  speed_kmh = estimate_speed_kmh(trip);

  if (!trip->warned_speeding && elapsed_ticks >= 3 && speed_kmh > trip->speed_limit_kmh + 10.0) {
    snprintf(camera, sizeof(camera), "CAM-%s-%03d", network->entries[trip->entry_index].id, state->tick % 1000);
    snprintf(message, sizeof(message), "Speeding detected on %s: %.1f km/h exceeds %.0f km/h.",
      trip->road_code, speed_kmh, trip->speed_limit_kmh);
    push_alert(state, "speeding", "warning", message, trip, camera, speed_kmh, route);
    trip->warned_speeding = 1;
  }

  if (!trip->warned_lingering && elapsed_ticks > (int)(trip->total_ticks * 1.35)) {
    snprintf(camera, sizeof(camera), "CAM-%s-%03d", network->entries[trip->entry_index].id, state->tick % 1000);
    snprintf(message, sizeof(message), "Unusually long travel time on %s (possible congestion/anomaly).", trip->road_code);
    push_alert(state, "lingering", "warning", message, trip, camera, speed_kmh, route);
    trip->warned_lingering = 1;
  }
}

static void progress_trips(const Network *network, SimulationState *state)
{
  int i;
  for (i = 0; i < MAX_ACTIVE_TRIPS; i++) {
    Trip *trip = &state->trips[i];
    if (!trip->active) continue;

    if (trip->ticks_left > 0) trip->ticks_left--;
    monitor_trip_behavior(network, state, trip);

    if (trip->ticks_left <= 0) {
      double final_speed = estimate_speed_kmh(trip);
      char route[48];
      char camera[32];
      char message[256];

      snprintf(route, sizeof(route), "%s:%s->%s",
        trip->road_code,
        network->entries[trip->entry_index].id,
        network->exits[trip->exit_index].id);

      if (final_speed > trip->speed_limit_kmh + 10.0) {
        snprintf(camera, sizeof(camera), "CAM-%s-EXIT-%03d", network->exits[trip->exit_index].id, state->tick % 1000);
        snprintf(message, sizeof(message), "Exit camera flagged speeding on %s: %.1f km/h > %.0f km/h.",
          trip->road_code, final_speed, trip->speed_limit_kmh);
        push_alert(state, "speeding_exit", "warning", message, trip, camera, final_speed, route);
      }

      trip->active = 0;
      state->active_trip_count--;
      state->completed_trips++;
      state->total_revenue += trip->expected_toll;
    }
  }
}

int simulation_tick(const Network *network, SimulationState *state, int steps)
{
  int s;
  if (!network || !state || steps <= 0) return 1;

  for (s = 0; s < steps; s++) {
    int roll;
    state->tick++;

    roll = random_range(100);
    if (roll < 50) spawn_trip(network, state);
    if (roll < 12) spawn_trip(network, state);

    progress_trips(network, state);
  }

  return 0;
}

void simulation_print_summary(const Network *network, const SimulationState *state)
{
  int shown = 0;
  int i;
  (void)network;
  printf("\nTick: %d\n", state->tick);
  printf("Active cars: %d\n", state->active_trip_count);
  printf("Completed cars: %d\n", state->completed_trips);
  printf("Revenue: %.2f PLN\n", state->total_revenue);
  printf("\nActive vehicle preview:\n");
  printf("ID    Plate    Road Entry -> Exit   Km   Ticks  Toll\n");
  printf("----------------------------------------------------\n");

  for (i = 0; i < MAX_ACTIVE_TRIPS && shown < 8; i++) {
    const Trip *trip = &state->trips[i];
    if (!trip->active) continue;
    printf("%-5d %-8s %-4s %-5s -> %-5s %-4d %-6d %.2f\n",
      trip->trip_id, trip->plate, trip->road_code,
      network->entries[trip->entry_index].id,
      network->exits[trip->exit_index].id,
      trip->distance_km, trip->ticks_left, trip->expected_toll);
    shown++;
  }
  if (shown == 0) printf("No active cars right now.\n");
}

void simulation_write_json(FILE *out, const Network *network, const SimulationState *state)
{
  int i;
  int emitted = 0;

  fprintf(out, "{");
  fprintf(out, "\"networkName\":\"%s\",", network->name);
  fprintf(out, "\"currency\":\"%s\",", network->currency);
  fprintf(out, "\"pricePerKm\":%.2f,", network->price_per_km);
  fprintf(out, "\"tick\":%d,", state->tick);
  fprintf(out, "\"activeTripCount\":%d,", state->active_trip_count);
  fprintf(out, "\"completedTrips\":%d,", state->completed_trips);
  fprintf(out, "\"revenue\":%.2f,", state->total_revenue);

  fprintf(out, "\"entries\":[");
  for (i = 0; i < network->entry_count; i++) {
    if (i > 0) fprintf(out, ",");
    fprintf(out, "{\"road\":\"%s\",\"id\":\"%s\",\"name\":\"%s\",\"km\":%d}",
      network->entries[i].road_code, network->entries[i].id, network->entries[i].name, network->entries[i].km);
  }
  fprintf(out, "],");

  fprintf(out, "\"exits\":[");
  for (i = 0; i < network->exit_count; i++) {
    if (i > 0) fprintf(out, ",");
    fprintf(out, "{\"road\":\"%s\",\"id\":\"%s\",\"name\":\"%s\",\"km\":%d}",
      network->exits[i].road_code, network->exits[i].id, network->exits[i].name, network->exits[i].km);
  }
  fprintf(out, "],");

  fprintf(out, "\"activeTrips\":[");
  for (i = 0; i < MAX_ACTIVE_TRIPS; i++) {
    const Trip *trip = &state->trips[i];
    if (!trip->active) continue;
    if (emitted > 0) fprintf(out, ",");
    fprintf(out,
      "{\"tripId\":%d,\"plate\":\"%s\",\"make\":\"%s\",\"model\":\"%s\",\"color\":\"%s\",\"road\":\"%s\",\"entryId\":\"%s\",\"exitId\":\"%s\",\"distanceKm\":%d,\"ticksLeft\":%d,\"totalTicks\":%d,\"speedLimitKmh\":%.1f,\"toll\":%.2f}",
      trip->trip_id, trip->plate, trip->make, trip->model, trip->color,
      trip->road_code,
      network->entries[trip->entry_index].id,
      network->exits[trip->exit_index].id,
      trip->distance_km, trip->ticks_left, trip->total_ticks, trip->speed_limit_kmh, trip->expected_toll);
    emitted++;
  }
  fprintf(out, "],");

  fprintf(out, "\"alerts\":[");
  for (i = 0; i < state->alert_count; i++) {
    const AlertEvent *a = &state->alerts[i];
    if (i > 0) fprintf(out, ",");
    fprintf(out,
      "{\"tick\":%d,\"type\":\"%s\",\"severity\":\"%s\",\"message\":\"%s\",\"vehicleA\":\"%s\",\"vehicleB\":\"%s\",\"make\":\"%s\",\"model\":\"%s\",\"color\":\"%s\",\"cameraId\":\"%s\",\"measuredSpeedKmh\":%.1f,\"speedLimitKmh\":%.1f,\"route\":\"%s\"}",
      a->tick, a->type, a->severity, a->message, a->vehicle_a, a->vehicle_b,
      a->make, a->model, a->color, a->camera_id, a->measured_speed_kmh, a->speed_limit_kmh, a->route);
  }
  fprintf(out, "]");

  fprintf(out, "}\n");
  fflush(out);
}
