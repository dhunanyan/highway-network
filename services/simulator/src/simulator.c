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

  trip = &state->trips[slot];
  memset(trip, 0, sizeof(*trip));
  trip->active = 1;
  trip->trip_id = state->next_trip_id++;
  trip->entry_index = random_range(network->entry_count);
  trip->exit_index = random_range(network->exit_count);
  trip->distance_km = abs(network->exits[trip->exit_index].km - network->entries[trip->entry_index].km);
  if (trip->distance_km < 10) {
    trip->distance_km = 10;
  }
  trip->ticks_left = 2 + (trip->distance_km / 50);
  trip->expected_toll = trip->distance_km * network->price_per_km;
  create_plate(trip->trip_id, trip->plate, sizeof(trip->plate));

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
      "{\"tripId\":%d,\"plate\":\"%s\",\"entryId\":\"%s\",\"exitId\":\"%s\",\"distanceKm\":%d,\"ticksLeft\":%d,\"toll\":%.2f}",
      trip->trip_id,
      trip->plate,
      network->entries[trip->entry_index].id,
      network->exits[trip->exit_index].id,
      trip->distance_km,
      trip->ticks_left,
      trip->expected_toll);
    emitted++;
  }
  fprintf(out, "]");

  fprintf(out, "}\n");
  fflush(out);
}
