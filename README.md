# Highway Network

Local machine highway toll-network simulator with shared live state.

<p align = "center">
  <img src="./docs/logo.png" alt="Logo" width="300" />
</p>

## Components

- `simulatord` (C): single source of truth for simulation state.
- `CLI monitor` (C): terminal client connected to daemon.
- `GUI app` (Electron): desktop visual client connected to daemon.

## Documentation

- [End User Guide](./docs/end-user-guide.md): detailed GUI guide, CLI guide, and class-topic mapping.

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
