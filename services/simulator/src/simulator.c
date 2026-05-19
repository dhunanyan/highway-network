#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "simulator.h"

static void create_plate(int trip_id, char *out_plate, size_t size)
{
  static const char *prefixes[] = {"WX", "PO", "KR", "LU", "KT"};
  const char *prefix = prefixes[trip_id % 5];
  snprintf(out_plate, size, "%s%04d", prefix, 1000 + trip_id);
}

static int random_range(int max_exclusive)
{
  if (max_exclusive <= 0) {
    return 0;
  }
  return rand() % max_exclusive;
}

static void push_alert(
  SimulationState *state,
  const char *severity,
  const char *message,
  const char *plane_a,
  const char *plane_b,
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
  snprintf(a->severity, sizeof(a->severity), "%s", severity ? severity : "warning");
  snprintf(a->message, sizeof(a->message), "%s", message ? message : "");
  snprintf(a->plane_a, sizeof(a->plane_a), "%s", plane_a ? plane_a : "");
  snprintf(a->plane_b, sizeof(a->plane_b), "%s", plane_b ? plane_b : "");
  snprintf(a->route, sizeof(a->route), "%s", route ? route : "");
}

static int can_launch_trip(
  const SimulationState *state,
  const Trip *candidate,
  const Trip **conflict_trip,
  int *conflict_progress_km
)
{
  const int min_separation_km = 35;
  int i;
  if (!state || !candidate) {
    return 0;
  }

  for (i = 0; i < MAX_ACTIVE_TRIPS; i++) {
    const Trip *other = &state->trips[i];
    double progress;
    int progressed_km;
    if (!other->active) {
      continue;
    }
    if (other->entry_index != candidate->entry_index || other->exit_index != candidate->exit_index) {
      continue;
    }

    progress = 1.0 - ((double)other->ticks_left / (double)(other->total_ticks > 0 ? other->total_ticks : 1));
    if (progress < 0.0) {
      progress = 0.0;
    }
    if (progress > 1.0) {
      progress = 1.0;
    }
    progressed_km = (int)(progress * (double)other->distance_km);

    if (progressed_km < min_separation_km) {
      if (conflict_trip) {
        *conflict_trip = other;
      }
      if (conflict_progress_km) {
        *conflict_progress_km = progressed_km;
      }
      return 0;
    }
  }

  return 1;
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
  const Trip *conflict = NULL;
  int conflict_progress_km = 0;
  char route[48];
  char alert_msg[192];
  Trip *trip;
  int slot = -1;
  int i;

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
  candidate.entry_index = random_range(network->entry_count);
  candidate.exit_index = random_range(network->exit_count);
  candidate.distance_km = abs(network->exits[candidate.exit_index].km - network->entries[candidate.entry_index].km);
  if (candidate.distance_km < 10) {
    candidate.distance_km = 10;
  }
  {
    const double ticks_per_km = 0.35;
    const int base_ticks = 8;
    int scaled_ticks = base_ticks + (int)(candidate.distance_km * ticks_per_km);
    if (scaled_ticks < 12) {
      scaled_ticks = 12;
    }
    candidate.total_ticks = scaled_ticks;
    candidate.ticks_left = scaled_ticks;
  }
  candidate.expected_toll = candidate.distance_km * network->price_per_km;
  create_plate(candidate.trip_id, candidate.plate, sizeof(candidate.plate));

  snprintf(route, sizeof(route), "%s->%s",
    network->entries[candidate.entry_index].id,
    network->exits[candidate.exit_index].id);

  if (!can_launch_trip(state, &candidate, &conflict, &conflict_progress_km)) {
    snprintf(alert_msg, sizeof(alert_msg),
      "Launch blocked: route %s already occupied too close to origin (%dkm).",
      route,
      conflict_progress_km);
    push_alert(state, "warning", alert_msg, candidate.plate, conflict ? conflict->plate : "n/a", route);
    return 0;
  }

  trip = &state->trips[slot];
  *trip = candidate;
  state->next_trip_id++;

  state->active_trip_count++;
  return 0;
}

static void progress_trips(SimulationState *state)
{
  int i;
  for (i = 0; i < MAX_ACTIVE_TRIPS; i++) {
    Trip *trip = &state->trips[i];
    if (!trip->active) {
      continue;
    }

    trip->ticks_left--;
    if (trip->ticks_left <= 0) {
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
  if (!network || !state || steps <= 0) {
    return 1;
  }

  for (s = 0; s < steps; s++) {
    int roll;
    state->tick++;

    roll = random_range(100);
    if (roll < 65) {
      spawn_trip(network, state);
    }
    if (roll < 20) {
      spawn_trip(network, state);
    }

    progress_trips(state);
  }

  return 0;
}

void simulation_print_summary(const Network *network, const SimulationState *state)
{
  int shown = 0;
  int i;
  printf("\n=== %s ===\n", network->name);
  printf("Tick: %d\n", state->tick);
  printf("Active trips: %d\n", state->active_trip_count);
  printf("Completed trips: %d\n", state->completed_trips);
  printf("Revenue: %.2f %s\n", state->total_revenue, network->currency);
  printf("Price per km: %.2f %s\n", network->price_per_km, network->currency);

  printf("\nActive trip preview:\n");
  printf("ID    Plate    Entry -> Exit    Km   Ticks  Toll\n");
  printf("------------------------------------------------\n");

  for (i = 0; i < MAX_ACTIVE_TRIPS && shown < 8; i++) {
    const Trip *trip = &state->trips[i];
    if (!trip->active) {
      continue;
    }

    printf("%-5d %-8s %-5s -> %-5s %-4d %-6d %.2f\n",
      trip->trip_id,
      trip->plate,
      network->entries[trip->entry_index].id,
      network->exits[trip->exit_index].id,
      trip->distance_km,
      trip->ticks_left,
      trip->expected_toll);
    shown++;
  }

  if (shown == 0) {
    printf("No active trips right now.\n");
  }
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
    fprintf(out, "{\"id\":\"%s\",\"name\":\"%s\",\"km\":%d}",
      network->entries[i].id, network->entries[i].name, network->entries[i].km);
  }
  fprintf(out, "],");

  fprintf(out, "\"exits\":[");
  for (i = 0; i < network->exit_count; i++) {
    if (i > 0) fprintf(out, ",");
    fprintf(out, "{\"id\":\"%s\",\"name\":\"%s\",\"km\":%d}",
      network->exits[i].id, network->exits[i].name, network->exits[i].km);
  }
  fprintf(out, "],");

  fprintf(out, "\"activeTrips\":[");
  for (i = 0; i < MAX_ACTIVE_TRIPS; i++) {
    const Trip *trip = &state->trips[i];
    if (!trip->active) continue;
    if (emitted > 0) fprintf(out, ",");
    fprintf(out,
      "{\"tripId\":%d,\"plate\":\"%s\",\"entryId\":\"%s\",\"exitId\":\"%s\",\"distanceKm\":%d,\"ticksLeft\":%d,\"totalTicks\":%d,\"toll\":%.2f}",
      trip->trip_id,
      trip->plate,
      network->entries[trip->entry_index].id,
      network->exits[trip->exit_index].id,
      trip->distance_km,
      trip->ticks_left,
      trip->total_ticks,
      trip->expected_toll);
    emitted++;
  }
  fprintf(out, "]");

  fprintf(out, ",\"alerts\":[");
  for (i = 0; i < state->alert_count; i++) {
    const AlertEvent *a = &state->alerts[i];
    if (i > 0) fprintf(out, ",");
    fprintf(out,
      "{\"tick\":%d,\"severity\":\"%s\",\"message\":\"%s\",\"planeA\":\"%s\",\"planeB\":\"%s\",\"route\":\"%s\"}",
      a->tick, a->severity, a->message, a->plane_a, a->plane_b, a->route);
  }
  fprintf(out, "]");

  fprintf(out, "}\n");
  fflush(out);
}
