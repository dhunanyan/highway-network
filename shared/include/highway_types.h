#ifndef HIGHWAY_TYPES_H
#define HIGHWAY_TYPES_H

#define MAX_GATES 32
#define MAX_NAME_LEN 64
#define MAX_ID_LEN 16
#define MAX_ROAD_CODE_LEN 8
#define MAX_ACTIVE_TRIPS 256
#define MAX_ALERTS 24

typedef enum GateType {
  GATE_ENTRY = 0,
  GATE_EXIT = 1
} GateType;

typedef struct Gate {
  GateType type;
  char road_code[MAX_ROAD_CODE_LEN];
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
  char make[24];
  char model[24];
  char color[24];
  char road_code[MAX_ROAD_CODE_LEN];
  int entry_index;
  int exit_index;
  int entry_tick;
  int ticks_left;
  int total_ticks;
  int distance_km;
  double speed_limit_kmh;
  double expected_toll;
  int warned_speeding;
  int warned_lingering;
} Trip;

typedef struct AlertEvent {
  int tick;
  char type[24];
  char severity[16];
  char message[256];
  char vehicle_a[16];
  char vehicle_b[16];
  char make[24];
  char model[24];
  char color[24];
  char camera_id[32];
  double measured_speed_kmh;
  double speed_limit_kmh;
  char route[48];
} AlertEvent;

typedef struct SimulationState {
  int tick;
  int next_trip_id;
  int completed_trips;
  double total_revenue;
  Trip trips[MAX_ACTIVE_TRIPS];
  int active_trip_count;
  AlertEvent alerts[MAX_ALERTS];
  int alert_count;
} SimulationState;

#endif
