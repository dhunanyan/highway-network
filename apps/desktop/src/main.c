#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "network_loader.h"
#include "simulator.h"

static void print_gates(const Network *network)
{
  int i;
  printf("\nEntry gates:\n");
  for (i = 0; i < network->entry_count; i++) {
    printf("  %s  %-16s km=%d\n", network->entries[i].id, network->entries[i].name, network->entries[i].km);
  }

  printf("Exit gates:\n");
  for (i = 0; i < network->exit_count; i++) {
    printf("  %s  %-16s km=%d\n", network->exits[i].id, network->exits[i].name, network->exits[i].km);
  }
}

int main(void)
{
  Network network;
  SimulationState state;
  char command[32];

  srand((unsigned int)time(NULL));

  if (network_load_csv("data/input/network.csv", &network) != 0) {
    fprintf(stderr, "Failed to load sample network data.\n");
    return 1;
  }

  simulation_init(&state);

  printf("highway-network local desktop app (terminal UI)\n");
  print_gates(&network);

  for (;;) {
    simulation_print_summary(&network, &state);
    printf("\nCommands: [1]=tick+1  [5]=tick+5  [r]=reset  [q]=quit\n> ");

    if (!fgets(command, sizeof(command), stdin)) {
      break;
    }

    if (command[0] == 'q') {
      break;
    }

    if (command[0] == 'r') {
      simulation_init(&state);
      continue;
    }

    if (command[0] == '1') {
      simulation_tick(&network, &state, 1);
      continue;
    }

    if (command[0] == '5') {
      simulation_tick(&network, &state, 5);
      continue;
    }

    printf("Unknown command.\n");
  }

  printf("Goodbye.\n");
  return 0;
}
