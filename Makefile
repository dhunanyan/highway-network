CC = gcc
CFLAGS = -Wall -Wextra -std=c11
INCLUDES = -Ishared/include -Iservices/simulator/include

APP = build/highway-network

SRCS = \
  apps/desktop/src/main.c \
  services/simulator/src/network_loader.c \
  services/simulator/src/simulator.c

.PHONY: help build run clean

help:
	@echo "Targets: build, run, clean"

build:
	@mkdir -p build
	$(CC) $(CFLAGS) $(INCLUDES) $(SRCS) -o $(APP)

run: build
	./$(APP)

clean:
	rm -rf build
