# RoboWebSim

[English](README.md) | [العربية](docs/i18n/README.ar.md) | [Français](docs/i18n/README.fr.md) | [Español](docs/i18n/README.es.md) | [Português (Brasil)](docs/i18n/README.pt-BR.md) | [简体中文](docs/i18n/README.zh-CN.md) | [日本語](docs/i18n/README.ja.md) | [한국어](docs/i18n/README.ko.md)

**Browser-based 3D robotics programming and navigation simulator.**

RoboWebSim lets learners and developers program a robot, run ordered command sequences, build Blockly programs, inspect virtual sensors, edit 3D arenas, and work through guided lessons directly in the browser.

**Live simulator:** https://robo-web-sim.vercel.app  
**Public game:** https://joenasr.itch.io/robosim

> RoboWebSim is intentionally a browser-first educational simulator. It does not require ROS, a robotics backend, or a native simulator runtime.

## What you can do

- control a robot directly in a configurable 3D arena
- build robot programs with Blockly
- execute ordered command queues with run, pause, stop, restart, and replay
- work through data-driven lessons with explicit completion rules
- load free-play scenarios
- inspect deterministic virtual sensor readings
- edit arena obstacles and targets
- place built-in and local GLB model-library assets
- save and restore arena scenes locally
- save, load, rename, delete, and import command programs
- use the simulator on desktop and mobile layouts

## Quick start

Requirements:

- Node.js supported by the current dependency tree
- npm
- a modern browser with WebGL support

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

Validation:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## First robot program

A simple first success path is:

1. Open `/simulator`.
2. Load a beginner free-play scenario.
3. Add robot movement blocks in the Blockly program area.
4. Run the program.
5. Observe the command queue, robot movement, sensor state, and target/collision result.

Blockly and the visible command queue use the same native simulator command representation, so the program shown in the block workspace maps to the commands the simulator executes.

## Main routes

### `/`

Project introduction and simulator entry point.

### `/simulator`

The main 3D workspace: robot controls, Blockly programming, command queue, lessons, scenarios, arena editing, model library, telemetry, sensors, and event log.

### `/lessons`

Lesson browser and local progress view.

## Architecture

RoboWebSim is a Next.js 16 / React 19 application written in TypeScript.

Core stack:

- Next.js App Router
- React 19
- Three.js
- React Three Fiber
- @react-three/drei
- Zustand
- Blockly
- Tailwind CSS
- browser `localStorage`
- Jest / jsdom

The application is organized around three primary layers.

### Simulation core

`src/sim/`

Contains robot state, motion, collision logic, command representation and execution, virtual sensor calculations, scene/program persistence, validation, and the central Zustand simulator controller.

Simulation logic is kept separate from the React UI so deterministic state transitions can be tested independently.

### 3D renderer

`src/components/Arena3D.tsx`

The arena is rendered with Three.js through React Three Fiber. It supports arena boundaries, robot rendering, obstacles, targets, built-in geometry, local GLB assets, orbit/navigation controls, and editable transforms.

WebGL-dependent scene code is loaded client-side.

### State and execution controller

`src/sim/robotController.ts`

The Zustand store coordinates:

- robot state
- arena state
- command queue
- command execution
- simulator lifecycle
- lesson and scenario state
- collision and target results
- virtual sensors
- event logging
- arena editing
- model placement
- saved scenes
- saved programs
- local persistence

Simulator lifecycle:

`idle | running | paused | completed | blocked`

Lesson lifecycle:

`not_started | in_progress | completed | failed`

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the current architecture in more detail.

## Robot motion model

Robot movement is deterministic and step-based.

Default translation step:

`0.5` world units

Default rotation step:

`π / 8` radians

Supported native commands:

- `forward`
- `backward`
- `left`
- `right`
- `wait`

Identical command sequences produce repeatable outcomes from the same robot pose and arena state.

## Blockly programming

Blockly blocks convert into RoboWebSim's native command representation before execution.

Current mapping:

| Blockly block | Native command |
| --- | --- |
| `robot_forward` | `forward` |
| `robot_backward` | `backward` |
| `robot_turn_left` | `left` |
| `robot_turn_right` | `right` |
| `robot_wait` | `wait` |

Unsupported block types are rejected rather than silently converted.

## Collision and targets

Collision and target detection live in the simulation layer rather than a rigid-body physics engine.

Current behavior includes:

- obstacle collision tests
- rotated-obstacle handling
- arena boundary detection
- target-radius detection

Robot health states:

- `ok`
- `hit_obstacle`
- `reached_target`

## Virtual sensors

Current deterministic sensor state includes:

- front obstacle distance
- left obstacle detection
- right obstacle detection
- nearest target distance

Sensor values are derived from robot pose and arena geometry. They are educational simulated sensors, not hardware-calibrated or noisy real-world sensor models.

## Arena editor and model library

Free-play mode supports editing operations such as:

- selecting obstacles or targets
- moving selected objects
- rotating obstacles
- duplicating and deleting obstacles
- adding obstacles
- placing assets from the model library
- resetting to scenario defaults

The model library supports:

- `builtin` Three.js geometry
- local `glb` assets loaded from `/public/models/`

Asset source and license metadata is stored with the model definitions. The generated GLB assets shipped in `public/models/` are documented separately in [public/models/README.md](public/models/README.md).

## Saved scenes and programs

RoboWebSim is local-first.

Saved scenes preserve complete arena configurations, including model IDs, transforms, local GLB references, and targets.

Saved programs preserve validated native command sequences.

Current browser-storage keys include:

- `robo-web-sim-saved-scenes`
- `robo-web-sim-saved-programs`
- lesson and active-mode persistence used by the simulator

There is currently no cloud synchronization.

## Lessons and scenarios

Lessons are data-driven and can define:

- arena overrides
- starting robot context
- completion rules

Completion rules can require combinations of:

- reaching a target
- avoiding collision
- making at least one turn
- completing the command queue

Enabled rules use AND semantics.

Free-play scenarios define complete starting environments independently of lesson mode.

## Testing

The repository contains Jest tests covering simulator and UI behavior, including:

- simulator-store transitions
- command execution
- terminal-state handling
- Blockly conversion and workspace behavior
- saved programs
- saved scenes
- model-library behavior
- arena editing
- responsive/mobile panel behavior
- simulator controls

Run:

```bash
npm test -- --runInBand
```

The CI workflow also runs lint, tests, and a production build for pull requests and pushes to `main`.

## Scope and simulation model

RoboWebSim is a robotics-learning and interaction simulator focused on browser accessibility, robot-command logic, navigation, environment authoring, and educational programming.

The current implementation does **not** claim to provide:

- continuous rigid-body physics
- validated robotics dynamics
- ROS interoperability
- Webots compatibility
- hardware-in-the-loop control
- physical robot control
- realistic sensor noise
- research-grade robot simulation

Webots informed some high-level simulator concepts such as separating robot state, controller logic, world configuration, sensors, and actuators. RoboWebSim is an independent implementation and is not a Webots distribution or compatibility layer.

## Examples

See [examples/README.md](examples/README.md) for example arena configuration data.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

Security issues should follow [SECURITY.md](SECURITY.md).

## License

RoboWebSim source code is licensed under the [MIT License](LICENSE).

Procedurally generated model assets may carry separate CC0 declarations as documented in [public/models/README.md](public/models/README.md).

## Project

RoboSim / RoboWebSim is also used as an interactive robotics-learning module within RoboMarket.

- RoboMarket: https://robomarket.ae/
- Joe Nasr: https://joe-nasr-signals.vercel.app/

Created by Joe Nasr.
