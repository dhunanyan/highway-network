CC = gcc
CFLAGS = -Wall -Wextra -std=c11
INCLUDES = -Ishared/include -Iservices/simulator/include

BUILD_DIR = build
CLI_APP = $(BUILD_DIR)/highway-network
SIM_DAEMON = $(BUILD_DIR)/simulatord

COMMON_SRCS = \
  services/simulator/src/network_loader.c \
  services/simulator/src/simulator.c

.PHONY: help build run-simulator run-cli run-gui clean

help:
	@echo "Targets: build, run-simulator, run-cli, run-gui, clean"

build:
	@mkdir -p $(BUILD_DIR)
	$(CC) $(CFLAGS) $(INCLUDES) apps/cli/src/main.c -o $(CLI_APP)
	$(CC) $(CFLAGS) $(INCLUDES) services/simulatord/src/main.c $(COMMON_SRCS) -o $(SIM_DAEMON)

run-simulator: build
	./$(SIM_DAEMON) data/input/network.csv build/highway-network.sock

run-cli: build
	./$(CLI_APP)

run-gui: build
	cd apps/gui && npm start

clean:
	rm -rf $(BUILD_DIR)
