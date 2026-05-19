# highway-network

Local machine highway toll-network simulator with shared live state.

## Components

- `simulatord` (C): single source of truth for simulation state.
- `CLI monitor` (C): terminal client connected to daemon.
- `GUI app` (Electron): desktop visual client connected to daemon.

## Run

1. Build:

```bash
make build
```

2. Start daemon (terminal 1):

```bash
make run-simulator
```

3. Start CLI monitor (terminal 2):

```bash
make run-cli
```

4. Start GUI (terminal 3):

```bash
cd apps/gui
npm start
```

Now both CLI and GUI interact with the same live state.

## Socket Protocol

UNIX socket: `build/highway-network.sock`

Commands:

- `STATE`
- `TICK <n>`
- `RESET`
- `QUIT`

Response: single-line JSON snapshot.
