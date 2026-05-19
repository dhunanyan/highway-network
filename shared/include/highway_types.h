#ifndef HIGHWAY_TYPES_H
#define HIGHWAY_TYPES_H

#define MAX_GATES 32
#define MAX_NAME_LEN 64
#define MAX_ID_LEN 16
#define MAX_ACTIVE_TRIPS 256

typedef enum GateType {
  GATE_ENTRY = 0,
  GATE_EXIT = 1
} GateType;

typedef struct Gate {
  GateType type;
  char id[MAX_ID_LEN];
  char name[MAX_NAME_LEN];
  int km;
} Gate;

typedef struct Network {
  Gate entries[MAX_GATES];
  int entry_count;
  Gate exits[MAX_GATES];
  int exit_count;
  double price_per_km;
  char currency[8];
  char name[MAX_NAME_LEN];
} Network;

typedef struct Trip {
  int active;
  int trip_id;
  char plate[16];
  int entry_index;
  int exit_index;
  int ticks_left;
  int total_ticks;
  int distance_km;
  double expected_toll;
} Trip;

typedef struct SimulationState {
  int tick;
  int next_trip_id;
  int completed_trips;
  double total_revenue;
  Trip trips[MAX_ACTIVE_TRIPS];
  int active_trip_count;
} SimulationState;

#endif
