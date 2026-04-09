# Architecture Overview

## High-Level Design

RoboWebSim is a **browser-first** application. All simulation logic runs client-side — there is no backend or API. The app is a statically generated Next.js site.

```
Browser
  └── Next.js App (App Router)
       ├── Pages: /, /simulator, /lessons
       ├── React Three Fiber (Three.js 3D scene)
       ├── Zustand Store (global simulation state)
       └── localStorage (lesson progress persistence)
```

## Directory Structure

```
src/
├── app/                  # Next.js pages (App Router)
│   ├── globals.css       # Tailwind base + custom component classes
│   ├── layout.tsx        # Root layout with metadata
│   ├── page.tsx          # Landing page (/)
│   ├── simulator/
│   │   └── page.tsx      # Simulator page (/simulator)
│   └── lessons/
│       └── page.tsx      # Lessons page (/lessons)
│
├── components/           # React UI components
│   ├── Arena3D.tsx       # Three.js 3D scene (Robot, Obstacles, Targets, Walls)
│   ├── RobotControls.tsx # D-pad buttons + play/pause/stop
│   ├── CommandQueue.tsx  # Command builder + queue list + run/clear controls
│   └── LessonsSidebar.tsx # Collapsible lesson list with completion state
│
├── sim/                  # Simulation core (pure logic, no UI)
│   ├── robotState.ts     # RobotState type + INITIAL_ROBOT_STATE constant
│   ├── arenaConfig.ts    # Obstacle/Target/ArenaConfig types + DEFAULT_ARENA
│   ├── motionSystem.ts   # moveForward, moveBackward, turnLeft, turnRight
│   ├── collisionHelpers.ts # AABB obstacle collision, radius target detection, wall check
│   ├── commandExecution.ts # CommandType enum + Command type + createCommand factory
│   └── robotController.ts  # Zustand store (SimulatorStore) — wires everything together
│
├── lessons/
│   └── lessonData.ts     # LESSONS array (id, title, objective, steps, successCondition, hint)
│
└── configs/
    └── simulatorConfig.ts # Constants (move step, turn step, camera position, delay)
```

## Core Modules

### `robotState.ts`
Defines the shape of the robot's runtime state:
- `position`: 3D coordinates `{ x, y, z }`
- `rotation`: Y-axis rotation in radians
- `isMoving`, `isRunningQueue`, `isPaused`: control flags
- `health`: `'ok' | 'hit_obstacle' | 'reached_target'`

### `arenaConfig.ts`
Static configuration for the simulation world:
- `DEFAULT_ARENA`: two red obstacles, one green circular target, 10×10 arena

### `motionSystem.ts`
Pure functions that take `RobotState` and return a partial state diff:
- Each step moves `MOVE_STEP = 0.5` units in the facing direction
- Each turn rotates `TURN_STEP = π/8` radians

### `collisionHelpers.ts`
- **AABB** (axis-aligned bounding box) for obstacle collision
- **Radius check** for target detection
- **Wall boundary check** to prevent leaving the arena

### `commandExecution.ts`
Defines `CommandType` and the `Command` interface. `createCommand(type)` generates a command with a unique id and display label.

### `robotController.ts` (Zustand store)
The single source of truth for all simulator state. Exposes:
- Robot movement methods (call motionSystem + collisionHelpers)
- Queue management methods (add, removeLastCommand, clearQueue)
- `runQueue()` — async loop with 600ms delay per command, supports pause/stop
- Lesson completion (with localStorage persistence)

## Data Flow

```
User Input (key / button)
       │
       ▼
useSimulatorStore action
  (moveForward, addCommand, etc.)
       │
       ▼
Zustand State Update
       │
       ▼
React re-render
  ├── Arena3D (useFrame reads robot state each frame)
  ├── RobotControls (reads robot.health, robot.isRunningQueue)
  ├── CommandQueue (reads commandQueue, currentCommandIndex)
  └── LessonsSidebar (reads completedLessons, robot.health)
```

## 3D Rendering

`Arena3D.tsx` uses `@react-three/fiber` (`Canvas`, `useFrame`) and `@react-three/drei` (`Box`, `Cylinder`, `Grid`, `OrbitControls`).

The `Robot` component reads position/rotation from Zustand on every frame via `useFrame`, enabling smooth visual updates without causing unnecessary React re-renders.

Arena3D is **dynamically imported** in the simulator page with `ssr: false` to prevent Three.js from running on the server during static generation.

## State Persistence

Lesson completion is stored in `localStorage` under the key `robo-web-sim-completed-lessons`. All localStorage access is guarded with `typeof window !== 'undefined'` for SSR compatibility.

## Tech Stack Summary

| Technology | Role |
|------------|------|
| Next.js 16 (App Router) | Routing, SSG, React server/client components |
| TypeScript | Type safety across all modules |
| Tailwind CSS | Utility-first styling |
| Three.js | 3D rendering engine |
| @react-three/fiber | React bindings for Three.js |
| @react-three/drei | Three.js helpers (Box, Grid, OrbitControls) |
| Zustand | Global simulation state management |
