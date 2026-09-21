# RoboSim / RoboWebSim

**Public game:** RoboSim  
**Play:** https://joenasr.itch.io/robosim  
**Source project:** RoboWebSim  
**Creator:** Joe Nasr  
**Creator profile:** https://joe-nasr-signals.vercel.app/

RoboSim is the public game title. RoboWebSim is the current source-project name for the browser robotics-learning simulator behind it.

The project is built with Next.js, React Three Fiber, Three.js, Zustand and a small deterministic simulation layer. Players sequence robot commands, run them in a 3D arena, inspect the result and revise their logic.

## Current status

Working educational simulator prototype.

The current application supports:

1. 3D arena rendering
2. Direct robot movement from keyboard and on-screen controls
3. Forward, backward, left, right and wait command queues
4. Deterministic queue execution
5. Scenario loading
6. Three introductory lessons
7. Grid-step motion and collision checks
8. Telemetry and event-log views
9. Lesson and scenario persistence in `localStorage`
10. Responsive desktop, tablet and mobile controls
11. Automated tests covering selected store behavior and route flows

## Webots reference

Webots was used as a conceptual reference for ideas such as separating robot state, controller logic, world configuration, sensors and actuators.

RoboWebSim is not a Webots distribution or compatibility layer. The current repository is a separate web implementation using its own Next.js and Three.js code structure. This statement describes the repository architecture; it is not a claim that every possible design pattern, algorithm or interaction concept is novel.

## Simulation boundary

The current simulator is designed for learning command sequencing and basic navigation logic. It does not implement a validated robotics physics environment, hardware-in-the-loop control, ROS compatibility, real robot control, sensor-noise modeling, continuous rigid-body dynamics or research-grade physical simulation.

Robot movement is currently grid-step based. A future physics-engine integration remains outside the implemented scope.

## Run locally

Prerequisites: Node.js 18 or later and npm.

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
npm run dev
```

Open `http://localhost:3000`.

Build:

```bash
npm run build
npm start
```

Tests:

```bash
npm test
```

## Main routes

- `/`: introduction and navigation
- `/simulator`: 3D simulator, controls, scenarios, command queue, telemetry and event log
- `/lessons`: lesson list and progress

## Current limitations

- arena configuration is not edited directly through the current public UI
- command sequences do not yet have full save/import support
- motion is grid-step based rather than continuous physics
- pinch and orbit behavior uses Three.js controls
- physical robot hardware is not connected
- no ROS or Webots interoperability is implemented

## Future directions

Possible extensions include editable arenas, command-program import/export, additional lessons, physics integration, visual programming, multiple robot types, lesson authoring and collaborative scenarios. These are roadmap ideas, not current features.