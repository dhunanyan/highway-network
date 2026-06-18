# GUI

This section explains the desktop GUI from the point of view of a normal user who wants to run the application, understand what the screen shows, and interact with the simulation safely and correctly.

## What the GUI is

The GUI is an Electron desktop client that connects to the highway simulator daemon and visualizes the current state of the motorway network. The GUI is not the simulator itself. The simulator is the C daemon process that owns the authoritative shared state. The GUI is a control and monitoring panel layered on top of that state.

In practice this means the following:

- The GUI displays live data that comes from the simulator daemon.
- The GUI can send commands such as `TICK 1`, `TICK 5`, `TICK 20`, and `RESET`.
- The GUI does not maintain its own independent copy of the simulation.
- If the CLI client is also open at the same time, both GUI and CLI observe the same simulator state.

This is the most important concept for an end user to understand. There is one shared simulation state, and multiple clients may connect to it.

## What you need before starting

To use the GUI comfortably, make sure the project is built first.

```bash
make build
```

After that, you can start the GUI in either of two ways.

### Standard explicit startup

This is the clearest and safest workflow.

Terminal 1:

```bash
make run-simulator
```

Terminal 2:

```bash
make run-gui
```

### GUI-first startup

You can also start the GUI directly.

```bash
make run-gui
```

If the GUI detects that the simulator daemon is not already running, it tries to start the daemon automatically in the background. This is convenient, but for debugging and classroom demonstrations the explicit two-terminal approach is usually better because you can see the daemon lifecycle directly.

## Recommended way to run the whole project

For full visibility, especially if you also want terminal monitoring, the recommended setup is:

Terminal 1:

```bash
make run-simulator
```

Terminal 2:

```bash
make run-cli
```

Terminal 3:

```bash
make run-gui
```

In this arrangement:

- the simulator daemon owns the truth,
- the CLI gives you compact terminal monitoring and control,
- the GUI gives you rich visual monitoring and interactive controls.

## What happens when the GUI opens

When the GUI window opens, several things are already happening:

- the application attempts to connect to the UNIX socket at `build/highway-network.sock`,
- if the daemon is available, the GUI starts polling current state,
- the GUI refreshes its view every 800 ms,
- the current language is restored from local storage if you changed it previously.

The GUI window itself is a monitoring dashboard, not a menu-driven wizard. That means almost everything is visible immediately on one page.

![Main dashboard view](./dashboard-main-view.png)

## High-level layout of the GUI

The GUI is organized as one continuous dashboard. The major areas are:

- header,
- language switcher,
- hero/overview panel,
- control buttons,
- four top metrics,
- road health section,
- camera watch section,
- revenue mix section,
- fleet intelligence section,
- command center tabs,
- entry gates section,
- exit gates section,
- active cars table,
- live traffic map,
- suspicious behavior warnings list.

The next subsections explain each of these in detail.

## Header

The header contains:

- the application name `highway-network`,
- a short subtitle indicating that this is a desktop GUI backed by a C simulator service,
- a status area,
- the language switcher button in the top-right corner.

### Status area

The status line is especially important when something goes wrong.

Normally it is empty.

It becomes populated when:

- the GUI cannot reach the daemon,
- the daemon returned an error payload,
- JSON coming back from the daemon could not be parsed,
- the socket connection failed.

If you see a message such as `Simulator error: daemon_connection_failed`, it usually means one of the following:

- the simulator daemon is not running,
- the socket file is missing,
- the daemon crashed,
- the GUI started before the daemon was ready,
- the daemon and GUI are pointing at different paths.

## Language switcher

In the top-right corner there is a small round button that shows an English-style flag icon. This button opens the language dropdown.

### Supported languages

The GUI currently ships with translations for:

- English,
- Polish,
- German,
- French,
- Spanish.

### How to use it

1. Click the flag button.
2. A dropdown menu appears.
3. Click the language you want.
4. The entire GUI rerenders immediately in that language.

![Language switcher](./languages.png)

### What gets translated

The translation layer affects all of the following:

- section titles,
- button labels,
- tab labels,
- table headers,
- map caption,
- legend labels,
- empty-state messages,
- warning labels,
- command center labels,
- hero panel copy,
- spotlight status text.

### Persistence

The selected language is saved locally in the browser storage used by Electron. That means:

- if you close the GUI and reopen it later,
- the GUI tries to restore the last selected language automatically.

### Important note

The simulator data itself is not multilingual. Vehicle makes, models, gate IDs, and raw route identifiers remain the same. Translation affects the client UI and explanatory labels, not the underlying simulation identifiers.

## Hero / overview panel

The first large dashboard block is the hero panel. It acts like a compact operational summary.

It contains:

- a small eyebrow label,
- the network title,
- a descriptive paragraph,
- three compact badges,
- a spotlight card.

### Network title

The current displayed name is the network name reported by the simulator data set. The loaded CSV currently defaults to a name similar to `A2-A4 Local Network` in the backend, while the GUI translation layer may present a friendlier dashboard title for end users.

### Badge 1: roads

This badge shows how many distinct roads are currently part of the loaded network data.

At the moment the dataset includes these motorway-style corridors:

- A1,
- A2,
- A4,
- A6,
- A8,
- A18,
- A50.

So the badge should normally show `7 roads` unless the dataset changes.

### Badge 2: cameras

This badge shows the total number of configured entry and exit gates combined.

In end-user terms, each gate behaves like a monitored checkpoint. The GUI calls them cameras because alerts and monitoring features frame them as observation points.

### Badge 3: active

This badge shows the number of currently active cars on the simulated network.

This number changes continuously as:

- new cars spawn,
- existing cars progress,
- completed trips leave the active set.

### Spotlight card

The spotlight card changes depending on whether there are active alerts.

If there is at least one recent alert:

- the card becomes a priority warning area,
- it highlights the most recent alert,
- it includes the route and identified vehicle metadata.

If there are no current alerts:

- the card shows a stable-flow operational status,
- it acts as a calm summary state.

This area is useful if you want one quick glance before reading the more detailed components below.

## Control buttons

Below the hero panel there is a row of control buttons.

These are the primary interactive controls in the GUI.

### `Tick +1`

Sends one simulation step to the daemon.

### `Tick +5`

Sends five simulation steps in one command.

### `Tick +20`

Sends twenty simulation steps in one command.

This is the fastest manual way to move the simulation forward significantly.

### `Start Auto`

Starts automatic ticking.

When enabled:

- the button label changes to `Stop Auto`,
- the GUI sends `TICK 1` automatically every 700 ms.

This is a client-side automation feature. It does not mean the daemon becomes autonomous on its own. The GUI is repeatedly asking the daemon to advance by one tick.

### `Reset`

Resets the simulation state in the daemon.

Reset clears and restarts:

- current tick counter,
- active trips,
- completed trip count,
- accumulated revenue,
- alerts,
- next trip ID sequence.

It does not remove the network definition itself. The road and gate topology remain loaded from the CSV file.

## The meaning of a tick

A tick is the central time unit of the entire simulation.

In the backend implementation:

- `1 tick = 30 simulated seconds`.

This is extremely important because many displayed values are derived from it.

### Why tick matters

Tick affects:

- how quickly cars progress through their trips,
- when a car can trigger speeding alerts,
- when a car can trigger lingering alerts,
- when revenue gets finalized,
- how fast `auto` mode advances the world.

### Real-time vs simulated time

Do not confuse GUI refresh speed with simulation time.

- GUI refresh interval: 800 ms real time,
- auto mode tick command interval: 700 ms real time,
- one simulation tick: 30 seconds simulated time.

So in auto mode the simulation clock can advance much faster than wall-clock time.

## Top metrics row

The next dashboard row shows four compact metrics.

### Tick

This is the current global simulation tick.

Interpret it as the elapsed logical timeline since the last reset.

If the tick is 10, then the simulated time progressed by:

- `10 * 30 seconds = 300 seconds = 5 minutes`.

### Active Cars

This is the number of currently active trips.

A car is active if:

- it has been spawned,
- it has not yet completed its trip.

### Completed

This is the number of trips that have fully finished.

A completed trip is one whose `ticks_left` reached zero or less, after which:

- the trip is removed from the active set,
- the completed counter increases,
- the expected toll is added to revenue,
- a final exit-speed alert may be generated if conditions are met.

### Revenue

This is the cumulative revenue collected from completed trips.

Important detail:

- revenue is added when a trip completes,
- not while the trip is still in progress.

So active trips contribute to expected future revenue, but not yet to the top-line revenue metric.

## Road Health Matrix

This section aggregates the current network state by road.

Each road card summarizes one corridor, such as A1 or A4.

### What each road card contains

Each card includes:

- road identifier,
- health badge,
- active cars on that road,
- cumulative expected toll value for currently active cars on that road,
- warning count for that road,
- average estimated live speed for active trips on that road.

### Health badge meaning

The badge is determined by warning count.

- `Stable` means no warnings on that road,
- `Watch` means at least one warning exists,
- `Hot` means warning count is above the higher threshold used by the UI.

This is a UI severity summary, not a legal enforcement classification.

### How average speed is estimated

The GUI estimates speed from simulated progress using:

- trip distance,
- total ticks for the trip,
- elapsed ticks,
- the definition that one tick is 30 simulated seconds.

### Important realism note

The current simulation is intentionally simplified and not fully calibrated to real motorway travel times. Because of how trip duration is currently generated, the estimated speeds are better treated as a monitoring-model output than as a strict real-world physical model.

That matters especially when you interpret warning density and average speed. The values are internally consistent for the simulation, but not yet tuned as a real traffic engineering model.

![Road health matrix](./road-health-matrix.png)

## Camera Watch

This section focuses on monitored gates.

It mixes entry and exit points and displays them as camera checkpoints.

### What each card shows

Each card shows:

- gate direction type,
- gate ID,
- whether the road is currently flagged or clear,
- road code,
- gate name,
- a simple lane label generated by the GUI.

### `Flagged road` vs `Clear feed`

These labels are GUI summaries.

A gate is considered flagged in this section when:

- there is at least one alert associated with the same road.

That does not necessarily mean the specific gate caused the alert. It means the road corridor is currently under attention.

![Entry and exit gates](./gates.png)

## Revenue Mix

This section groups currently active trips into toll buckets.

### What the buckets mean

The buckets are based on expected toll value for active trips.

- low toll corridor,
- medium toll corridor,
- high toll corridor,
- total collected.

### How toll is calculated

The simulator uses:

- `price_per_km = 0.45 PLN`,
- `expected_toll = distance_km * price_per_km`.

Examples:

- 100 km trip -> 45.00 PLN,
- 200 km trip -> 90.00 PLN,
- 300 km trip -> 135.00 PLN.

### What the bucket labels represent

The GUI buckets are based on toll thresholds:

- below 80 PLN,
- 80 to 160 PLN,
- above 160 PLN.

This section is useful if you want a fast view of how the current active traffic is distributed economically.

![Revenue and matrix area](./revenue-matrix.png)

## Fleet Intelligence

This section summarizes the active fleet composition.

### Metrics shown

The panel currently displays:

- average live speed,
- dominant make,
- dominant color,
- warning density.

### Dominant make

This is simply the most frequent vehicle make among active trips.

Possible makes in the current simulator pool include:

- Toyota,
- Skoda,
- Volkswagen,
- BMW,
- Audi,
- Ford,
- Renault,
- Kia.

### Dominant color

This is the most frequent color among active trips.

Possible colors in the current simulator pool include:

- White,
- Black,
- Silver,
- Blue,
- Red,
- Gray.

### Warning density

This is a GUI-derived percentage:

- number of alerts divided by number of active cars.

It is a coarse operational signal, not a scientific risk ratio.

## Command Center

This is a tabbed analytical section.

It contains three tabs:

- Overview,
- Risk Radar,
- Fleet Watch.

Only one tab is shown at a time.

### How tabs work

Clicking a tab changes the visible content in that panel. It does not change the simulator. Tabs are purely a presentation feature.

### Overview tab

This tab contains three summary cards.

#### Network Posture

This gives a broad qualitative summary of current traffic load.

The wording changes depending on active trip count. It is meant to sound like an operator console summary.

#### Most Pressured Road

This identifies the road with the largest warning count.

If no road is currently especially problematic, the panel says so.

#### Camera Coverage

This describes how many configured gate cameras exist across how many motorway corridors.

### Risk Radar tab

This tab focuses on warnings.

#### Latest Warnings

Shows several of the newest warnings in a condensed list.

#### Risk Heuristic

Provides a simplified judgment about whether monitoring should be intensified.

This is based on alert volume, not on a complex risk-scoring model.

#### Operator Note

This is explanatory text intended to help the user interpret repeated speeding patterns.

### Fleet Watch tab

This tab focuses on vehicles.

#### Fastest Live Cars

Shows several currently fastest active trips as estimated by the GUI.

#### Identity Depth

Explains what identifying attributes the system tracks per active car.

These include:

- license plate,
- make,
- model,
- color,
- road,
- route,
- camera source,
- live toll figure.

#### Flow Character

Provides a qualitative description of current flow based on active trip count.

![Command Center tabs](./command-center.png)

## Entry Gates section

This section lists all configured entry checkpoints from the currently loaded network file.

Each row includes:

- road code,
- entry ID,
- human-readable gate name.

Current examples include entries such as:

- `A1 · E_GDA - Gdansk`,
- `A2 · E_WAW - Warszawa Zachod`,
- `A4 · E_KRK - Krakow`.

These are static network definitions, not dynamic events.

## Exit Gates section

This works exactly like Entry Gates, but for exit checkpoints.

Examples include:

- `A1 · X_GLI - Gliwice`,
- `A2 · X_MIN - Minsk Mazowiecki`,
- `A4 · X_KOR - Korczowa Border`.

## Active Cars table

This is one of the most important sections in the entire GUI.

It shows the currently active trips in structured tabular form.

### Columns

#### ID

Internal trip ID assigned by the simulator.

#### Plate

License plate generated for the trip. The plate is synthesized from a fixed pool of Polish-style prefixes and a numeric sequence.

Examples follow a pattern like:

- `WX1001`,
- `PO1002`,
- `KR1003`.

#### Entry

Road and entry gate identifier.

#### Exit

Road and exit gate identifier.

#### Km

Distance for the trip in kilometers.

This is calculated as the absolute difference between entry km and exit km on the same road.

#### Ticks Left

How many simulation ticks remain before the trip completes.

#### Toll

Expected toll for that trip, calculated from distance and price per kilometer.

### Fixed-height behavior

The active cars area is intentionally scrollable at a fixed height so the page does not keep expanding as more cars appear. This makes the dashboard more stable during longer runs.

### What happens when no cars are active

If there are no active trips, the table shows an empty-state message rather than collapsing.

![Active cars table](./active-cars.png)

## Live Traffic Map

This section is the visual topology view of the network.

### What the map is

The map is not a geographic GIS map. It is an abstract network topology map.

That means:

- positions are chosen for readability,
- roads are represented as hubs,
- gate points sit to the left and right of hubs,
- cars are animated along stylized paths.

### What the colors mean

The legend defines the colors.

- blue hub: connected autostrada hub,
- purple hub: disconnected autostrada hub,
- green point: entry camera gate,
- orange point: exit camera gate,
- red category in legend: warning-related meaning.

### Connected vs disconnected

The GUI contains a manually defined abstract connection map between selected roads.

Current visual connections include:

- A1 <-> A2,
- A1 <-> A4,
- A4 <-> A8,
- A4 <-> A18,
- A2 <-> A50.

Roads that are present in data but not present in those connection pairs appear as visually disconnected hubs in this abstract representation.

### Gate placement

For each road:

- entry gates are positioned on one side of the hub,
- exit gates are positioned on the opposite side,
- labels use gate IDs.

### Car animation

Each active trip is drawn as:

- a dashed path from entry gate to road hub to exit gate,
- a moving colored marker along that path.

The marker color is based on the toll color scale currently used by the GUI.

### Empty state

If no active cars exist, the map displays a centered message saying that there are no active cars on the network.

![Live traffic graph](./graph.png)

## Suspicious Behavior Warnings

This section collects alert events generated by the simulator.

### What kinds of alerts exist currently

The backend currently produces alerts for:

- speeding during the trip,
- unusually long travel time during the trip,
- speeding detected again at exit.

### What data each warning shows

Each warning block may include:

- alert type,
- tick when it occurred,
- warning message,
- vehicle plate,
- vehicle make,
- vehicle model,
- vehicle color,
- camera ID,
- measured speed,
- speed limit,
- route.

### Why these warnings exist

The warning system is meant to simulate motorway monitoring, not collision detection. Earlier project versions used an airplane-style collision model, but the current app instead focuses on suspicious road behavior.

### Alert timing rules currently used by the simulator

#### Speeding during trip

A speeding alert may appear if:

- the trip has existed for at least 3 ticks,
- the estimated speed exceeds road speed limit by more than 10 km/h.

#### Lingering / unusual duration

A lingering alert may appear if:

- elapsed ticks exceed `135%` of the trip's planned total ticks.

#### Exit-speed alert

A final speeding alert may appear when the trip completes if the final estimated speed still exceeds the road limit by more than 10 km/h.

## What is monitored by the simulator

The simulator monitors a combination of structural, economic, and behavioral data.

### Structural monitoring

- roads,
- entry gates,
- exit gates,
- route topology.

### Trip monitoring

- trip ID,
- plate,
- make,
- model,
- color,
- road,
- entry gate,
- exit gate,
- entry tick,
- total ticks,
- ticks left,
- distance,
- speed limit,
- expected toll.

### Aggregate monitoring

- active trip count,
- completed trip count,
- cumulative revenue,
- alert count.

### Behavioral monitoring

- speeding risk,
- long-duration anomalies,
- road-level warning pressure.

## How cars are generated

Cars are spawned randomly by the daemon when the simulation advances.

### Spawn probability per tick

For every tick:

- one spawn attempt happens if a random roll is below 50,
- a second additional spawn attempt happens if the same roll is below 12.

This means:

- there is often zero, one, or sometimes two new cars per tick,
- the average spawn rate is approximately `0.62 cars per tick`.

Since one tick equals 30 simulated seconds, the expected average is approximately:

- `1.24 cars per simulated minute`,
- `74.4 cars per simulated hour`.

This is not a real traffic calibration. It is the current simulation rule.

## How trip duration is generated

Trip duration is not taken from real road speeds or a live traffic model. It is currently derived using a simple formula.

The simulator calculates:

- `ticks_per_km = 0.35`,
- `base_ticks = 8`,
- `total_ticks = base_ticks + int(distance_km * 0.35)`,
- minimum total ticks = `12`.

This means longer trips take more ticks, but not in a strictly realistic transport-model way.

## Speed limits used in the model

Current backend speed limits are simple road-code rules:

- A8 -> 120 km/h,
- A6 -> 120 km/h,
- all other current roads -> 140 km/h.

This is important when you read warnings.

## Revenue model used in the app

The simulator uses a simple linear toll system.

- price per km = 0.45 PLN,
- total toll = distance in km * 0.45.

Revenue is only booked when the trip finishes.

## What the GUI does not currently do

For end-user clarity, here are some things the current GUI does not do:

- it does not edit the network CSV,
- it does not let you create custom cars manually,
- it does not provide historical charts over long time windows,
- it does not save scenario files,
- it does not expose low-level daemon commands other than tick/reset through the visible controls,
- it does not model physical collisions,
- it is not a literal geographic map.

## Practical usage workflow for a normal user

A good way to use the GUI is:

1. Start the simulator daemon.
2. Open the GUI.
3. Confirm the status line is empty.
4. Check the hero badges for roads, cameras, and active cars.
5. Use `Tick +1` a few times to watch the system evolve slowly.
6. Inspect the `Active Cars` table and `Live Traffic Map` together.
7. Open `Start Auto` if you want continuous movement.
8. Monitor `Suspicious Behavior Warnings` for anomalies.
9. Use `Command Center` tabs to interpret pressure, risk, and fleet composition.
10. Use `Reset` when starting a new demo or test run.
11. Change the language from the top-right menu if needed.

## Troubleshooting the GUI

### The GUI opens but nothing moves

Possible reasons:

- you did not click any tick button,
- auto mode is not enabled,
- the daemon is unavailable,
- the status line shows a simulator connection error.

### The GUI shows daemon connection errors

Check:

```bash
make status
```

Then make sure:

- `build/highway-network.sock` exists,
- the daemon is actually running,
- `build/simulatord` exists,
- you built the project.

### The GUI language did not change

Possible reasons:

- the dropdown was not opened fully,
- the selected language button was not clicked,
- the app is running older cached code and needs restart.

### The map seems abstract, not geographic

That is expected. The map is a topology visualization, not a literal real-world map.

### Speeds seem high

That is a correct observation. The current simulator timing model is simplified and may produce aggressive speeds relative to real traffic. Treat the behavior as simulation logic, not as calibrated real-road telemetry.

# CLI

This section explains how to use the terminal client.

The CLI is intentionally much smaller than the GUI. It is designed for quick control, lightweight monitoring, and classroom-friendly use in a terminal.

## What the CLI is

The CLI is a C terminal client that connects to the same simulator daemon as the GUI.

It does not maintain local simulation state. Just like the GUI, it sends commands over the UNIX socket and receives back the latest JSON snapshot.

![CLI monitor](./cli.png)

## How to start the CLI

First build the project if needed.

```bash
make build
```

Then start the daemon in one terminal.

```bash
make run-simulator
```

Then start the CLI in another terminal.

```bash
make run-cli
```

You can also point the CLI at a custom socket path if needed:

```bash
./build/highway-network /absolute/path/to/highway-network.sock
```

or:

```bash
HIGHWAY_NETWORK_SOCKET=/absolute/path/to/highway-network.sock ./build/highway-network
```

## What the CLI shows at startup

When it opens, the CLI prints a banner with:

- application name,
- short description,
- socket path,
- command list.

The socket path used by the CLI is:

- `build/highway-network.sock`

## CLI commands

The CLI supports a deliberately small command set.

The commands are validated strictly. For example:

- `1` is valid,
- `5` is valid,
- `20` is valid,
- `15` is not valid,
- `1abc` is not valid.

This prevents accidental simulator changes caused by malformed input.

### `1`

Advance simulation by one tick.

### `5`

Advance simulation by five ticks.

### `20`

Advance simulation by twenty ticks.

### `r`

Reset the simulation.

### `h`

Print the help banner again.

### `q`

Quit the CLI.

## Automatic polling behavior

Even when you do not type anything, the CLI is still active.

The CLI uses `select()` with a 1-second timeout. That means:

- it waits for user input,
- if no input arrives within one second,
- it automatically requests `STATE` from the daemon,
- it prints a compact current-state line.

This creates a lightweight live monitor without forcing constant user interaction.

## What the compact state line means

A typical CLI state line looks conceptually like this:

```text
[state] tick=12 active=7 completed=4 revenue=153.00
```

This line shows:

- current tick,
- number of active cars,
- number of completed cars,
- cumulative revenue.

It is intentionally compact. The CLI does not attempt to print the full detailed trip table that the GUI renders.

## How CLI commands affect the GUI

Because both clients share the same daemon state:

- if you press `1` in the CLI,
- the GUI will shortly show the updated state,
- and vice versa.

So the CLI is not a separate simulation. It is another controller for the same simulation.

## How the CLI communicates

Each CLI command:

- opens a UNIX domain socket connection,
- sends a line-based command,
- reads the full JSON response,
- closes the connection.

The CLI also protects itself against oversized daemon responses. If the returned JSON snapshot is larger than the CLI buffer, the command is rejected with an explicit error instead of being silently truncated.

Supported daemon commands include:

- `STATE`,
- `TICK <n>`,
- `RESET`,
- `QUIT`.

The CLI itself exposes `STATE`, `TICK`, and `RESET` indirectly through its key commands. It does not expose `QUIT` as a typed user command because `q` only exits the CLI itself, not the daemon.

## What the CLI is good for

The CLI is especially useful when:

- you want to test the simulator quickly,
- you want a low-overhead terminal view,
- you are running the GUI and want a second monitoring channel,
- you are debugging whether commands reach the daemon,
- you are demonstrating socket-based shared state behavior in class.

## What the CLI does not show

The CLI does not provide:

- the traffic map,
- translated UI labels,
- tabbed analysis panels,
- visual warnings list,
- camera cards,
- per-road dashboard panels,
- interactive language switching.

It is intentionally compact.

## Recommended CLI workflow

A good end-user CLI workflow is:

1. Start the daemon.
2. Open the CLI.
3. Wait a second and observe automatic status polling.
4. Type `1` to move slowly.
5. Type `5` or `20` to stress the simulation.
6. Watch the `active`, `completed`, and `revenue` values change.
7. Use `r` to reset if needed.
8. Use `h` if you forgot the keys.
9. Use `q` when you want to close the CLI window.

## CLI troubleshooting

### The CLI says the daemon is unavailable

That usually means the socket connection failed.

Check:

```bash
make status
```

Then verify:

- the daemon is running,
- the socket exists,
- the project was built,
- the path `build/highway-network.sock` is correct.

### You press keys and nothing useful happens

Make sure you are typing one of the supported commands exactly:

- `1`,
- `5`,
- `20`,
- `r`,
- `h`,
- `q`.

Any other input produces an unknown-command error message.

### The CLI quits but the GUI still works

That is normal. The CLI is only a client. Closing it does not stop the daemon.

## GUI and CLI together

The strongest way to use the project is to use both clients at the same time.

The GUI gives you:

- visual topology,
- structured panels,
- warnings feed,
- language support,
- richer operational interpretation.

The CLI gives you:

- fast keyboard control,
- automatic one-line state monitoring,
- low-overhead terminal visibility.

Using both at once helps you understand the shared-state architecture of the project very clearly.

# Topics From Classes

This section maps the final project to the topics covered in the `laby` folder. The goal here is not to force every lab topic into the project. Instead, this section explains honestly which topics are used directly, which are used conceptually, and which are currently not part of the implementation.

## LAB01 - Make, libraries, and low-level C project structure

### What was used directly

The project uses a `Makefile` as the main build entrypoint.

That reflects the lab theme of:

- structured native builds,
- explicit compilation targets,
- command-line project orchestration.

### Where it appears

Main file:

- `Makefile`

Examples of targets:

- `build`,
- `run-simulator`,
- `run-cli`,
- `run-gui`,
- `status`,
- `clean`.

### What was not used directly from LAB01

The final project does not currently build custom static or dynamic libraries like the `libsort.a` / `libsort.so` exercises from the labs. The code is organized into modules and compiled into executables, but not packaged as a reusable standalone library.

## LAB02 - Processes

### What was used directly

The project is fundamentally multi-process.

At runtime you commonly have:

- one daemon process,
- one CLI process,
- one GUI process.

This is one of the strongest lab-to-project continuities.

### Where it appears

The architecture relies on the fact that separate programs run independently and communicate through IPC.

Practical examples:

- `simulatord` is a standalone process,
- the CLI is a standalone client process,
- the Electron GUI is another standalone client process,
- the GUI can even spawn the daemon process if it is not already running.

Relevant file:

- `apps/gui/src/main.js`

There the GUI uses Node's `spawn(...)` to start the daemon in the background if needed.

### Why this matches the lab topic

In LAB02 you practiced process-based decomposition. The final project uses the same operating-system idea at a larger scale:

- responsibility is split across separate processes,
- state ownership is centralized,
- user interfaces act as clients instead of embedding the simulator directly.

## LAB03 - Signals

### What was used directly

Signals are used in the daemon through:

- `signal(SIGPIPE, SIG_IGN);`

### Where it appears

File:

- `services/simulatord/src/main.c`

### Why it is used

If a client disconnects while the daemon is writing a response, a `SIGPIPE` could otherwise terminate the daemon process.

By ignoring `SIGPIPE`, the daemon survives client disconnects and remains available for future clients.

### Why this matters

This is a real and practical operating-systems use of signals:

- not just classroom signaling,
- but resilience of an IPC server under imperfect client behavior.

## LAB04 - Potoki (pipes)

### What was used directly

Unnamed pipes are not used directly in the final project.

### What was used conceptually

LAB04 introduced process-to-process communication as a design pattern. The final project absolutely depends on IPC, but it uses a different mechanism:

- UNIX domain sockets instead of unnamed pipes.

### Why it still belongs in the topic mapping

The key learning transfer from the lab is:

- separate processes can exchange structured messages,
- a request/response protocol can coordinate independent programs.

That idea is central to this project even though the concrete primitive changed from `pipe()` to `AF_UNIX` sockets.

## LAB04 - Kolejki komunikatow (message queues)

### What was used directly

System V or POSIX message queues are not used directly in the final project.

### What was used conceptually

The project still follows the spirit of queue-style IPC in the sense that:

- messages are sent between independent actors,
- commands are discrete units such as `STATE`, `TICK 1`, and `RESET`,
- responses are serialized payloads in JSON.

### Actual implementation used instead

The real mechanism here is:

- UNIX domain stream sockets,
- text commands,
- JSON responses.

So this topic is best described as conceptually related, not directly implemented using the same API as the lab.

## LAB05 - Watki (threads)

### What was used directly

Native threads are not used directly in the C simulator core.

### Why this is important to say explicitly

The current project avoids thread-based shared-state synchronization inside the C daemon. Instead it uses:

- one state-owning daemon process,
- one-client-request-at-a-time server loop,
- IPC between processes.

This keeps the concurrency model simpler for the current project stage.

### Conceptual note

Electron and Node.js internally use their own runtime machinery, but from the point of view of the course topic, the final C application logic is not designed around explicit pthread-based threading.

## LAB05 - Semafory i pamiec wspolna

### What was used directly

Semaphores and shared memory are not used directly in the current implementation.

### What was chosen instead

The project chooses a different synchronization and communication model:

- centralized state in one daemon process,
- explicit command/response over UNIX sockets,
- no shared memory segment between clients and daemon.

### Why that is still a meaningful design choice

This is useful from a systems-design perspective because it avoids:

- semaphore coordination complexity,
- shared-memory cleanup issues,
- multi-writer race conditions across clients.

Instead, the daemon acts as the single serialization point.

## Additional operating-systems concepts visible in the project

Even beyond the exact lab names, the final project demonstrates several OS-oriented ideas clearly.

### UNIX domain sockets

Used directly by:

- daemon server,
- CLI client,
- GUI client.

These sockets provide local IPC on the same machine through:

- `AF_UNIX`,
- `SOCK_STREAM`,
- a filesystem socket path.

### Single source of truth process

The daemon is the only owner of mutable simulation state.

This is an important systems architecture choice because it prevents the GUI and CLI from diverging.

### Request/response protocol

The project defines a very small local protocol:

- `STATE`,
- `TICK <n>`,
- `RESET`,
- `QUIT`.

### Polling and event timing

Examples:

- CLI uses `select()` with a one-second timeout,
- GUI polls every 800 ms,
- GUI auto-mode issues one tick every 700 ms.

### Structured serialization

The daemon serializes state to JSON so both clients can consume the same data model.

This is especially useful because:

- the CLI can parse enough fields for compact output,
- the GUI can render a much richer interface from the same snapshot.

## Honest summary of lab-topic usage

The most directly used class topics in this final project are:

- `Makefile`-based native project organization from LAB01,
- multi-process architecture from LAB02,
- signal handling from LAB03,
- IPC as a general pattern from LAB04.

The topics that are not directly implemented in the current final project are:

- unnamed pipes as the actual runtime IPC mechanism,
- System V message queues as the runtime IPC mechanism,
- pthread-based worker logic,
- semaphore/shared-memory synchronization.

That is not a weakness. It simply means the final project chose one coherent systems design path:

- process separation,
- socket-based local IPC,
- one daemon owning shared state,
- multiple clients observing and controlling it.
