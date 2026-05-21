CC = gcc
CFLAGS = -Wall -Wextra -std=c11
INCLUDES = -Ishared/include -Iservices/simulator/include

BUILD_DIR = build
CLI_APP = $(BUILD_DIR)/highway-network
SIM_DAEMON = $(BUILD_DIR)/simulatord

COMMON_SRCS = \
  services/simulator/src/network_loader.c \
  services/simulator/src/simulator.c

# Terminal styling
BOLD = \033[1m
DIM = \033[2m
RESET = \033[0m
BLUE = \033[34m
GREEN = \033[32m
YELLOW = \033[33m
MAGENTA = \033[35m
CYAN = \033[36m

.DEFAULT_GOAL := help

.PHONY: help build run-simulator run-cli run-gui status clean

help:
	@printf "$(BOLD)$(CYAN)highway-network$(RESET)\n"
	@printf "$(DIM)Local simulation toolkit (daemon + CLI + GUI)$(RESET)\n\n"
	@printf "$(BOLD)$(BLUE)Targets$(RESET)\n"
	@printf "  $(GREEN)build$(RESET)          Compile CLI + simulator daemon binaries\n"
	@printf "  $(GREEN)run-simulator$(RESET)  Start C simulator daemon (shared state owner)\n"
	@printf "  $(GREEN)run-cli$(RESET)        Start C terminal client (monitor/control)\n"
	@printf "  $(GREEN)run-gui$(RESET)        Start Electron GUI client\n"
	@printf "  $(GREEN)status$(RESET)         Show quick runtime checks\n"
	@printf "  $(GREEN)clean$(RESET)          Remove build artifacts\n\n"
	@printf "$(BOLD)$(MAGENTA)Quick Start$(RESET)\n"
	@printf "  1. make build\n"
	@printf "  2. make run-simulator   $(DIM)# terminal 1$(RESET)\n"
	@printf "  3. make run-cli         $(DIM)# terminal 2$(RESET)\n"
	@printf "  4. make run-gui         $(DIM)# terminal 3$(RESET)\n\n"
	@printf "$(BOLD)$(YELLOW)Socket$(RESET)\n"
	@printf "  build/highway-network.sock\n\n"
	@printf "$(DIM)Tip: use 'make status' before launching clients.$(RESET)\n"

build:
	@printf "$(BOLD)$(BLUE)[build]$(RESET) Compiling binaries...\n"
	@mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) $(INCLUDES) apps/cli/src/main.c -o $(CLI_APP)
	$(CC) $(CFLAGS) $(INCLUDES) services/simulatord/src/main.c $(COMMON_SRCS) -o $(SIM_DAEMON)
	@printf "$(GREEN)[ok]$(RESET) Build complete: $(CLI_APP), $(SIM_DAEMON)\n"

run-simulator: build
	@printf "$(BOLD)$(BLUE)[run-simulator]$(RESET) Launching daemon...\n"
	./$(SIM_DAEMON) data/input/network.csv build/highway-network.sock

run-cli: build
	@printf "$(BOLD)$(BLUE)[run-cli]$(RESET) Launching CLI client...\n"
	./$(CLI_APP)

run-gui: build
	@printf "$(BOLD)$(BLUE)[run-gui]$(RESET) Launching Electron GUI...\n"
	cd apps/gui && npm start

status:
	@printf "$(BOLD)$(BLUE)[status]$(RESET) Runtime checks\n"
	@printf "  Node: "
	@node -v 2>/dev/null || printf "not found\n"
	@printf "  npm:  "
	@npm -v 2>/dev/null || printf "not found\n"
	@printf "  CLI binary: "
	@test -x $(CLI_APP) && printf "$(GREEN)ready$(RESET)\n" || printf "$(YELLOW)missing$(RESET) (run make build)\n"
	@printf "  Daemon binary: "
	@test -x $(SIM_DAEMON) && printf "$(GREEN)ready$(RESET)\n" || printf "$(YELLOW)missing$(RESET) (run make build)\n"
	@printf "  Socket file: "
	@test -S build/highway-network.sock && printf "$(GREEN)active$(RESET)\n" || printf "$(YELLOW)not active$(RESET)\n"

clean:
	@printf "$(BOLD)$(BLUE)[clean]$(RESET) Removing build artifacts...\n"
	rm -rf $(BUILD_DIR)
	@printf "$(GREEN)[ok]$(RESET) Clean complete\n"
