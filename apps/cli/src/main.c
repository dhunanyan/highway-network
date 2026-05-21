#include <errno.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/select.h>
#include <sys/socket.h>
#include <sys/un.h>
#include <unistd.h>

#define SOCKET_PATH "build/highway-network.sock"
#define C_RESET "\033[0m"
#define C_BOLD "\033[1m"
#define C_DIM "\033[2m"
#define C_GREEN "\033[32m"
#define C_YELLOW "\033[33m"
#define C_RED "\033[31m"
#define C_CYAN "\033[36m"
#define C_BLUE "\033[34m"

static int send_command(const char *command, char *out, size_t out_size)
{
  int fd;
  struct sockaddr_un addr;
  ssize_t n;
  size_t offset = 0;

  if (!command || !out || out_size == 0) {
    return 1;
  }

  fd = socket(AF_UNIX, SOCK_STREAM, 0);
  if (fd < 0) {
    return 1;
  }

  memset(&addr, 0, sizeof(addr));
  addr.sun_family = AF_UNIX;
  snprintf(addr.sun_path, sizeof(addr.sun_path), "%s", SOCKET_PATH);

  if (connect(fd, (struct sockaddr *)&addr, sizeof(addr)) != 0) {
    close(fd);
    return 1;
  }

  if (write(fd, command, strlen(command)) < 0 || write(fd, "\n", 1) < 0) {
    close(fd);
    return 1;
  }

  while ((n = read(fd, out + offset, out_size - 1 - offset)) > 0) {
    offset += (size_t)n;
    if (offset >= out_size - 1) {
      break;
    }
  }

  out[offset] = '\0';
  close(fd);
  return 0;
}

static int json_int(const char *json, const char *key)
{
  char pattern[64];
  const char *p;
  int value = 0;
  snprintf(pattern, sizeof(pattern), "\"%s\":", key);
  p = strstr(json, pattern);
  if (!p) return 0;
  sscanf(p + (int)strlen(pattern), "%d", &value);
  return value;
}

static double json_double(const char *json, const char *key)
{
  char pattern[64];
  const char *p;
  double value = 0.0;
  snprintf(pattern, sizeof(pattern), "\"%s\":", key);
  p = strstr(json, pattern);
  if (!p) return 0.0;
  sscanf(p + (int)strlen(pattern), "%lf", &value);
  return value;
}

static void print_compact_state(const char *json)
{
  int tick = json_int(json, "tick");
  int active = json_int(json, "activeTripCount");
  int completed = json_int(json, "completedTrips");
  double revenue = json_double(json, "revenue");
  printf(
    C_BLUE "[state]" C_RESET " tick=" C_BOLD "%d" C_RESET
    " active=" C_BOLD "%d" C_RESET
    " completed=" C_BOLD "%d" C_RESET
    " revenue=" C_GREEN "%.2f" C_RESET "\n",
    tick, active, completed, revenue
  );
  fflush(stdout);
}

static void print_banner(void)
{
  printf(C_BOLD C_CYAN "highway-network CLI monitor" C_RESET "\n");
  printf(C_DIM "Shared live state via daemon socket" C_RESET "\n");
  printf("Socket: " C_BOLD "%s" C_RESET "\n\n", SOCKET_PATH);

  printf(C_BOLD "Commands" C_RESET "\n");
  printf("  " C_GREEN "1" C_RESET "      Tick +1\n");
  printf("  " C_GREEN "5" C_RESET "      Tick +5\n");
  printf("  " C_GREEN "20" C_RESET "     Tick +20\n");
  printf("  " C_GREEN "r" C_RESET "      Reset simulation\n");
  printf("  " C_GREEN "h" C_RESET "      Show this help\n");
  printf("  " C_GREEN "q" C_RESET "      Quit CLI\n\n");
}

int main(void)
{
  char input[32];
  char response[8192];

  print_banner();

  for (;;) {
    fd_set rfds;
    struct timeval tv;
    int ret;

    FD_ZERO(&rfds);
    FD_SET(STDIN_FILENO, &rfds);
    tv.tv_sec = 1;
    tv.tv_usec = 0;

    ret = select(STDIN_FILENO + 1, &rfds, NULL, NULL, &tv);
    if (ret < 0) {
      if (errno == EINTR) continue;
      break;
    }

    if (ret == 0) {
      if (send_command("STATE", response, sizeof(response)) == 0) {
        print_compact_state(response);
      } else {
        printf(C_YELLOW "[state]" C_RESET " daemon unavailable on %s\n", SOCKET_PATH);
      }
      continue;
    }

    if (!fgets(input, sizeof(input), stdin)) {
      break;
    }

    if (input[0] == 'q') {
      printf(C_DIM "Bye." C_RESET "\n");
      break;
    }

    if (input[0] == 'h') {
      printf("\n");
      print_banner();
      continue;
    }

    if (input[0] == 'r') {
      printf(C_BLUE "[cmd]" C_RESET " reset\n");
      if (send_command("RESET", response, sizeof(response)) == 0) {
        print_compact_state(response);
      } else {
        printf(C_RED "[error]" C_RESET " failed to send RESET\n");
      }
      continue;
    }

    if (input[0] == '1' || input[0] == '5') {
      printf(C_BLUE "[cmd]" C_RESET " tick +%c\n", input[0]);
      if (send_command(input[0] == '1' ? "TICK 1" : "TICK 5", response, sizeof(response)) == 0) {
        print_compact_state(response);
      } else {
        printf(C_RED "[error]" C_RESET " failed to send TICK\n");
      }
      continue;
    }

    if (strncmp(input, "20", 2) == 0) {
      printf(C_BLUE "[cmd]" C_RESET " tick +20\n");
      if (send_command("TICK 20", response, sizeof(response)) == 0) {
        print_compact_state(response);
      } else {
        printf(C_RED "[error]" C_RESET " failed to send TICK 20\n");
      }
      continue;
    }

    printf(C_RED "[error]" C_RESET " unknown command. Press " C_BOLD "h" C_RESET " for help.\n");
  }

  return 0;
}
