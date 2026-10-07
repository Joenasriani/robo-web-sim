# Architecture Overview

## High-level design

RoboWebSim is a browser-first robotics-learning application. Its current simulator workflow runs client-side and does not require a robotics backend, ROS runtime, or native simulator process.

```text
Browser
  └── Next.js App Router
       ├── /                  project entry
       ├── /simulator         3D simulator workspace
       ├── /lessons           lesson browser
       ├── React UI           controls, panels, Blockly, editing
       ├── React Three Fiber  3D rendering
       ├── Zustand            simulator state and execution
       └── localStorage       supported local persistence
```

The architecture deliberately separates simulation logic from presentation so deterministic robot behavior can be tested independently of React and WebGL rendering.

## Main architectural areas

### Application routes

`src/app/`

Contains the App Router pages and global presentation layer.

Primary routes:

- `/`
- `/simulator`
- `/lessons`

The simulator's WebGL-dependent scene is loaded client-side.

### UI and interaction components

`src/components/`

This layer contains the simulator interface, including:

- 3D arena rendering
- robot controls
- Blockly programming workspace
- command queue UI
- lesson/scenario controls
- arena editing
- model-library interaction
- simulator settings
- telemetry and virtual-sensor presentation
- event feedback and logging
- responsive/mobile interaction panels

UI components read and update simulator state through the central controller rather than implementing separate robot-state logic.

### Simulation core

`src/sim/`

The simulation core is the source of truth for deterministic robot behavior.

It includes responsibilities such as:

- robot state
- motion
- collision and target detection
- command types and execution
- virtual sensors
- simulator lifecycle
- arena state
- validation
- saved-program handling
- saved-scene handling
- local persistence
- central Zustand coordination

The exact file list can evolve, but simulation behavior should remain in this layer rather than being duplicated in UI components.

### Lessons

`src/lessons/`

Lessons are data-driven and can define:

- arena overrides
- robot starting context
- completion requirements

Supported rule concepts include:

- reaching a target
- avoiding collisions
- making at least one turn
- completing the command queue

Enabled completion rules use AND semantics.

### Scenarios

`src/scenarios/`

Free-play scenarios define complete starting environments independently of lesson mode.

Scenario data can include:

- ID
- title
- description
- difficulty
- robot starting pose
- full arena definition

Loading a scenario resets relevant simulator context before activating the selected free-play environment.

### Model library

`src/models/`

The model library stores curated model definitions and provenance metadata.

A model definition can describe:

- stable ID
- display name
- category
- description
- creator
- source
- license
- preview image
- render type
- local GLB path
- placement defaults

Current render strategies:

- `builtin` — Three.js primitive geometry
- `glb` — local GLB/glTF assets

Shipped GLB files live under `public/models/`.

## State and execution controller

The Zustand simulator controller coordinates application state such as:

- robot pose and health
- arena configuration
- command queue
- active command
- execution lifecycle
- lessons
- scenarios
- collisions and target results
- virtual sensors
- event log
- editing state
- selected/placed models
- saved scenes
- saved programs
- local persistence

Simulator lifecycle states are explicit:

```text
idle | running | paused | completed | blocked
```

Lesson state is tracked independently:

```text
not_started | in_progress | completed | failed
```

This prevents general execution state and lesson progress from being conflated.

## Robot motion

Robot motion is deterministic and step-based.

Current defaults:

- translation: `0.5` world units per step
- rotation: `π / 8` radians per turn

Supported native commands:

- `forward`
- `backward`
- `left`
- `right`
- `wait`

The same starting robot state, arena state, and command sequence should produce the same result.

## Command execution

Robot programs use an ordered native command queue.

Execution supports:

- run
- pause
- stop
- restart
- replay from start
- configurable speed
- terminal collision/target handling

The controller tracks current execution and prevents stale asynchronous runs from continuing after interruption or restart.

## Blockly integration

Blockly is an authoring interface over the simulator's native command model.

Current mapping:

| Blockly block | Native command |
| --- | --- |
| `robot_forward` | `forward` |
| `robot_backward` | `backward` |
| `robot_turn_left` | `left` |
| `robot_turn_right` | `right` |
| `robot_wait` | `wait` |

Unsupported block types are rejected by the conversion layer.

The visible command queue and Blockly workspace are therefore not separate execution systems: both resolve to the simulator's native command representation.

## Collision and target detection

Collision and target detection are handled in simulation logic rather than delegated to a rigid-body physics engine.

Current behavior includes:

- obstacle collision checks
- rotated-obstacle handling
- arena-boundary detection
- target-radius detection

Robot health states include:

- `ok`
- `hit_obstacle`
- `reached_target`

## Virtual sensors

Virtual sensors are derived from robot pose and arena geometry.

Current sensor concepts include:

- front obstacle distance
- left obstacle detection
- right obstacle detection
- nearest target distance

These are deterministic educational sensor models. They are not intended to reproduce calibrated hardware noise or research-grade physical sensing.

## 3D rendering

RoboWebSim renders the arena with Three.js through React Three Fiber and helpers from `@react-three/drei`.

The scene supports:

- arena floor and boundaries
- robot representation
- obstacles
- targets
- built-in primitives
- local GLB assets
- orbit/navigation controls
- editable transforms

Robot state is sourced from the simulator controller and reflected into the 3D scene.

## Arena editing

Free-play editing is intentionally separated from controlled lesson layouts.

Current editing concepts include:

- object selection
- movement
- obstacle rotation
- duplication
- deletion
- adding obstacles
- model-library placement
- scenario reset

## Persistence

RoboWebSim is local-first.

Browser storage is currently used for supported state such as:

- lesson progress
- active mode/context
- saved scenes
- saved command programs

Saved scenes preserve arena configuration and relevant model references/transforms.

Saved programs preserve validated native command sequences.

There is currently no cloud synchronization requirement for the simulator.

## Testing boundary

The test suite covers simulation and UI behavior including areas such as:

- store transitions
- motion and command execution
- terminal states
- Blockly conversion/workspace behavior
- saved programs and scenes
- model-library behavior
- arena editing
- responsive/mobile panel behavior
- simulator controls

Repository CI is intended to run:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Scope boundary

RoboWebSim is not currently a replacement for a research or industrial robotics simulator.

The architecture does not claim:

- continuous rigid-body physics
- validated dynamics
- ROS interoperability
- Webots compatibility
- hardware-in-the-loop control
- physical robot control
- realistic sensor noise

Those boundaries are part of the product definition, not undocumented omissions.
