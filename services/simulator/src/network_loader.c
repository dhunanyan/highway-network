#include <ctype.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "network_loader.h"

static void trim(char *s)
{
  size_t len;
  while (*s && isspace((unsigned char)*s)) {
    memmove(s, s + 1, strlen(s));
  }

  len = strlen(s);
  while (len > 0 && isspace((unsigned char)s[len - 1])) {
    s[len - 1] = '\0';
    len--;
  }
}

static int parse_type(const char *value, GateType *out_type)
{
  if (strcmp(value, "ENTRY") == 0) {
    *out_type = GATE_ENTRY;
    return 0;
  }
  if (strcmp(value, "EXIT") == 0) {
    *out_type = GATE_EXIT;
    return 0;
  }
  return 1;
}

int network_load_csv(const char *path, Network *out_network)
{
  FILE *fp;
  char line[256];

  if (!path || !out_network) {
    return 1;
  }

  memset(out_network, 0, sizeof(*out_network));
  strcpy(out_network->currency, "PLN");
  strcpy(out_network->name, "A2-A4 Local Network");
  out_network->price_per_km = 0.45;

  fp = fopen(path, "r");
  if (!fp) {
    perror("fopen network.csv");
    return 1;
  }

  while (fgets(line, sizeof(line), fp) != NULL) {
    char *token;
    char *saveptr = NULL;
    char *fields[4];
    int i;
    GateType type;

    trim(line);
    if (line[0] == '\0' || line[0] == '#') {
      continue;
    }

    i = 0;
    token = strtok_r(line, ",", &saveptr);
    while (token && i < 4) {
      trim(token);
      fields[i++] = token;
      token = strtok_r(NULL, ",", &saveptr);
    }

    if (i != 4 || parse_type(fields[0], &type) != 0) {
      fclose(fp);
      return 1;
    }

    if (type == GATE_ENTRY) {
      Gate *g;
      if (out_network->entry_count >= MAX_GATES) {
        fclose(fp);
        return 1;
      }
      g = &out_network->entries[out_network->entry_count++];
      g->type = type;
      snprintf(g->id, sizeof(g->id), "%s", fields[1]);
      snprintf(g->name, sizeof(g->name), "%s", fields[2]);
      g->km = atoi(fields[3]);
    } else {
      Gate *g;
      if (out_network->exit_count >= MAX_GATES) {
        fclose(fp);
        return 1;
      }
      g = &out_network->exits[out_network->exit_count++];
      g->type = type;
      snprintf(g->id, sizeof(g->id), "%s", fields[1]);
      snprintf(g->name, sizeof(g->name), "%s", fields[2]);
      g->km = atoi(fields[3]);
    }
  }

  fclose(fp);
  return (out_network->entry_count > 0 && out_network->exit_count > 0) ? 0 : 1;
}
