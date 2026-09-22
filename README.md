# RoboSim / RoboWebSim

RoboSim is a browser-based 3D robot-navigation and programming simulator built by Joe Nasr.

Public game:
https://joenasr.itch.io/robosim

Source project:
RoboWebSim

## RoboMarket Learning

RoboSim / RoboWebSim is a free interactive robotics-learning module used within RoboMarket.ae.

RoboMarket:
https://robomarket.ae/

Joe Nasr:
https://joe-nasr-signals.vercel.app/

## What it is

RoboWebSim is a browser-first robotics-learning simulator for building, executing, and inspecting robot navigation programs inside configurable 3D arenas.

The simulator supports direct robot control, ordered command execution, Blockly-based visual programming, configurable free-play environments, guided lessons, sensor readouts, collision/target detection, reusable command programs, saved arena scenes, and a local 3D model library.

The application runs its simulation logic client-side. It does not require a robotics backend, ROS installation, or native simulator runtime.

## Architecture

RoboWebSim is implemented as a Next.js 16 / React 19 application using TypeScript.

Core stack:

- Next.js App Router for application routing and static web delivery
- React 19 for the interface
- Three.js for 3D rendering
- React Three Fiber for React-driven Three.js scene composition
- @react-three/drei for Three.js helpers, controls, geometry and GLTF loading
- Zustand for global simulator state and execution control
- Blockly for block-based robot programming
- Tailwind CSS for interface styling
- localStorage for client-side lesson, scene and program persistence
- Jest / jsdom for simulator and interface tests

The application is organized around three main layers:

### Simulation core

`src/sim/`

Contains the robot state, movement system, collision logic, command representation, sensor calculations, validation, scene/program persistence and the central Zustand simulator store.

The simulation core is separated from the React UI so movement, collision, command conversion and state transitions can be tested independently.

### 3D renderer

`src/components/Arena3D.tsx`

The arena is rendered with Three.js through React Three Fiber.

Robot position and orientation are read from simulator state and applied to the Three.js robot group during the render loop.

The scene supports:

- arena floor and boundaries
- robot rendering
- obstacles
- targets
- built-in primitive assets
- local GLB assets
- orbit/navigation controls
- editable object transforms

The Three.js simulator is loaded client-side to avoid executing WebGL-dependent code during server rendering.

### State and execution controller

`src/sim/robotController.ts`

A Zustand store acts as the central simulator controller.

It manages:

- robot state
- arena state
- command queue
- command execution
- simulation lifecycle
- lessons
- scenarios
- collision results
- sensor state
- event logging
- arena editing
- model placement
- saved scenes
- saved command programs
- local persistence

Simulator lifecycle states are explicit:

`idle | running | paused | completed | blocked`

Lesson state is tracked independently:

`not_started | in_progress | completed | failed`

## Robot motion model

Robot motion is currently deterministic and step-based.

Default translation step:

`0.5` world units

Default rotation step:

`π / 8` radians

Movement is calculated from the robot's current Y-axis rotation:

- forward
- backward
- turn left
- turn right
- wait

The movement functions are pure state transformations. After each movement, the controller recalculates collision state and sensor values.

This makes identical command sequences produce repeatable results from the same initial robot and arena state.

## Command execution

Robot programs use an ordered command queue.

Supported command types:

`forward`
`backward`
`left`
`right`
`wait`

Commands receive unique IDs and human-readable labels.

The queue executor runs commands sequentially and tracks the currently executing command for UI visualization.

Execution supports:

- run
- pause
- stop
- restart
- replay from start
- terminal collision/target states
- configurable simulation speed

A run identifier is used internally to invalidate stale asynchronous execution loops when a new run begins or execution is interrupted.

## Blockly programming

RoboWebSim includes a Blockly programming workspace.

Blockly robot blocks are converted into the simulator's native command representation before execution.

Current block mapping:

`robot_forward` → `forward`

`robot_backward` → `backward`

`robot_turn_left` → `left`

`robot_turn_right` → `right`

`robot_wait` → `wait`

Unsupported block types are rejected by the conversion layer instead of silently generating commands.

This keeps block programming and the normal command queue on the same underlying execution system.

## Collision system

Collision and target detection are implemented in the simulation layer rather than delegated to a rigid-body physics engine.

The current system includes:

- obstacle collision tests
- rotated-obstacle collision handling
- arena boundary detection
- target-radius detection

Axis-aligned obstacles use bounding-box checks.

Rotated obstacles transform the robot position into the obstacle's local coordinate space before testing against its bounds.

A collision changes robot health to:

`hit_obstacle`

Reaching a target changes it to:

`reached_target`

Otherwise:

`ok`

## Virtual sensors

Sensor values are derived from the current robot pose and arena geometry.

Current sensor state includes:

- front obstacle distance
- left obstacle detection
- right obstacle detection
- nearest target distance

Front-distance sensing uses ray-to-box and ray-to-arena-boundary intersection calculations in the XZ plane.

Side detection uses angled rays relative to the robot heading.

These are deterministic simulated sensors; they are not physics-engine, hardware, or noisy real-world sensor models.

## Arena system

An arena is represented as structured configuration data:

`ArenaConfig`

It contains:

- arena size
- obstacles
- targets
- wall color
- floor color

Obstacles contain position, dimensions, color and optional rotation.

Model-library objects can also preserve:

- model ID
- local GLB URL
- rotation

Targets contain position, radius and color.

Lessons can override the default arena configuration, while free-play scenarios can supply complete arena definitions.

## Free-play arena editor

Free-play mode includes an arena editor.

Implemented editing operations include:

- select obstacle or target
- move selected objects
- rotate obstacles in 45° increments
- duplicate obstacles
- delete objects
- add obstacles
- place assets from the model library
- reset the arena to its scenario defaults

Editing state is kept separate from lesson mode so lesson layouts remain controlled by lesson definitions.

## 3D model library

The simulator includes a curated local model library.

Assets can use either:

`builtin` — Three.js primitive geometry

or:

`glb` — local GLB/glTF assets loaded with `useGLTF`

Current categories include:

- obstacles
- props
- targets
- environment objects
- robots

GLB files are stored locally under:

`/public/models/`

The model registry preserves source, creator and license metadata.

No live third-party model API is required at runtime.

## Saved scenes

Free-play arenas can be saved locally.

Each `SavedScene` stores:

- ID
- user-defined name
- save timestamp
- originating scenario
- complete arena configuration

The persisted arena includes obstacle transforms, model IDs, GLB references and targets so the scene can be reconstructed.

Storage:

`localStorage`

Key:

`robo-web-sim-saved-scenes`

There is currently no cloud synchronization.

## Saved programs

Command sequences can also be saved as reusable programs.

Each saved program contains:

- ID
- name
- command sequence
- creation timestamp
- update timestamp

Programs can be:

- saved
- loaded
- renamed
- deleted
- imported after structural validation

Only supported simulator command types are accepted.

Storage key:

`robo-web-sim-saved-programs`

## Lessons

Lessons are data-driven.

A lesson can define:

- its own arena overrides
- initial robot context
- completion conditions

Completion rules can require combinations of:

- reaching a target
- avoiding collision
- making at least one turn
- completing the command queue

Enabled rules use AND semantics: all required conditions must pass.

The simulator tracks lesson status separately from the general simulator execution state.

## Free-play scenarios

Free-play scenarios provide complete starting environments independently of the lesson system.

Loading a scenario resets the relevant robot, arena, queue and lesson context and activates the selected free-play environment.

Scenario metadata can include:

- ID
- title
- description
- difficulty
- starting robot pose
- arena definition

## Persistence

RoboWebSim is local-first.

Browser storage is used for:

- completed lessons
- active mode
- active lesson
- active scenario
- saved scenes
- saved programs

Storage access is guarded for browser-only execution so it does not interfere with Next.js rendering.

No user account or backend database is required for the current simulator.

## Main application routes

`/`

Project introduction and simulator entry point.

`/simulator`

3D simulation workspace, robot controls, block programming, command queue, lessons, scenarios, arena editing, model library, telemetry and event log.

`/lessons`

Lesson browser and progress view.

## Testing

The repository contains Jest tests covering simulation and UI behavior, including:

- store transitions
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
npm test
```

## Development

Requirements:

- Node.js
- npm

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

Development server:

`http://localhost:3000`

Production build:

```bash
npm run build
npm start
```

Lint:

```bash
npm run lint
```

## Simulation boundary

RoboWebSim is a browser robotics-learning and interaction simulator.

The current implementation does not claim to provide:

- continuous rigid-body physics
- validated robotics dynamics
- ROS interoperability
- Webots compatibility
- hardware-in-the-loop control
- physical robot control
- realistic sensor noise
- research-grade robot simulation

Movement is intentionally deterministic and step-based.

The project is designed around browser interaction, robot-command logic, navigation, environment authoring and educational simulation rather than replacement of a robotics physics platform.

## Webots reference

Webots informed some high-level simulator concepts, particularly the separation of robot state, controller logic, world configuration, sensors and actuators.

RoboWebSim is an independent browser implementation and is not a Webots distribution or compatibility layer.

## Technology

Next.js 16 · React 19 · TypeScript · Three.js · React Three Fiber · Drei · Zustand · Blockly · Tailwind CSS · Jest

Created by Joe Nasr.

https://joe-nasr-signals.vercel.app/
