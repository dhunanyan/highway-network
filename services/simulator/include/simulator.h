#ifndef SIMULATOR_H
#define SIMULATOR_H

#include "highway_types.h"

void simulation_init(SimulationState *state);
int simulation_tick(const Network *network, SimulationState *state, int steps);
void simulation_print_summary(const Network *network, const SimulationState *state);

#endif
