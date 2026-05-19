#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <time.h>
#include <unistd.h>
#include "network_loader.h"
#include "simulator.h"

#define DEFAULT_SOCKET_PATH "build/highway-network.sock"

static int handle_command(const char *line, FILE *out, const Network *network, SimulationState *state)
{
  if (strncmp(line, "STATE", 5) == 0) {
    simulation_write_json(out, network, state);
    return 0;
  }

  if (strncmp(line, "RESET", 5) == 0) {
    simulation_init(state);
    simulation_write_json(out, network, state);
    return 0;
  }

  if (strncmp(line, "TICK", 4) == 0) {
    int steps = 1;
    if (sscanf(line + 4, "%d", &steps) != 1 || steps <= 0) {
      steps = 1;
    }
    simulation_tick(network, state, steps);
    simulation_write_json(out, network, state);
    return 0;
  }

  if (strncmp(line, "QUIT", 4) == 0) {
    fprintf(out, "{\"ok\":true,\"message\":\"daemon_stopping\"}\n");
    fflush(out);
    return 1;
  }

  fprintf(out, "{\"error\":\"unknown_command\"}\n");
  fflush(out);
  return 0;
}

int main(int argc, char **argv)
{
  const char *data_path = "data/input/network.csv";
  const char *socket_path = DEFAULT_SOCKET_PATH;
  Network network;
  SimulationState state;
  int server_fd;
  struct sockaddr_un addr;

  if (argc >= 2 && argv[1] && argv[1][0] != '\0') {
    data_path = argv[1];
  }
  if (argc >= 3 && argv[2] && argv[2][0] != '\0') {
    socket_path = argv[2];
  }

  srand((unsigned int)time(NULL));

  if (network_load_csv(data_path, &network) != 0) {
    fprintf(stderr, "error: failed to load network data from %s\n", data_path);
    return 1;
  }

  simulation_init(&state);

  unlink(socket_path);
  server_fd = socket(AF_UNIX, SOCK_STREAM, 0);
  if (server_fd < 0) {
    perror("socket");
    return 1;
  }

  memset(&addr, 0, sizeof(addr));
  addr.sun_family = AF_UNIX;
  snprintf(addr.sun_path, sizeof(addr.sun_path), "%s", socket_path);

  if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
    perror("bind");
    close(server_fd);
    return 1;
  }

  if (listen(server_fd, 16) != 0) {
    perror("listen");
    close(server_fd);
    unlink(socket_path);
    return 1;
  }

  fprintf(stderr, "simulatord listening on %s\n", socket_path);

  for (;;) {
    int client_fd;
    FILE *client_out;
    char line[128];
    ssize_t n;
    int should_stop;

    client_fd = accept(server_fd, NULL, NULL);
    if (client_fd < 0) {
      if (errno == EINTR) {
        continue;
      }
      perror("accept");
      break;
    }

    n = read(client_fd, line, sizeof(line) - 1);
    if (n <= 0) {
      close(client_fd);
      continue;
    }

    line[n] = '\0';

    client_out = fdopen(dup(client_fd), "w");
    if (!client_out) {
      close(client_fd);
      continue;
    }

    should_stop = handle_command(line, client_out, &network, &state);

    fclose(client_out);
    close(client_fd);

    if (should_stop) {
      break;
    }
  }

  close(server_fd);
  unlink(socket_path);
  return 0;
}
