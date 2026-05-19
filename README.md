# highway-network

Local machine highway toll-network simulator with a terminal UI, implemented in C.

## Project Start Point

- Build: `make build`
- Run: `make run`

The main executable is built as `build/highway-network`.

## Current Architecture

- `apps/desktop/src` - local UI application (terminal-based).
- `services/simulator/src` - simulation logic and network data loader.
- `services/simulator/include` - service headers.
- `shared/include` - shared domain types.
- `data/input/network.csv` - first sample data set.

## Notes

- This is intentionally local-first (no web app).
- The simulator tracks entries/exits, active trips, and toll revenue.
- Next UI upgrade path can be `ncurses`, SDL2, or Electron wrapper while preserving this C simulation service.
