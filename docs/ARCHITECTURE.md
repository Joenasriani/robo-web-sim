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
│   ├── LessonsSidebar.tsx # Collapsible lesson list with status + completion rules
│   ├── ScenarioSelector.tsx # Free-play scenario chooser with metadata panel
│   ├── TelemetryPanel.tsx # Numeric readouts + sim state + mode + scenario/lesson status
│   ├── EventLog.tsx      # Chronological event ring-buffer panel
│   ├── SimFeedback.tsx   # Overlay feedback toast
│   └── SimSettings.tsx   # Speed / step sliders
│
├── sim/                  # Simulation core (pure logic, no UI)
│   ├── robotState.ts     # RobotState type + INITIAL_ROBOT_STATE constant
│   ├── arenaConfig.ts    # Obstacle/Target/ArenaConfig/ArenaOverrides types + DEFAULT_ARENA
│   ├── motionSystem.ts   # moveForward, moveBackward, turnLeft, turnRight
│   ├── collisionHelpers.ts # AABB obstacle collision, radius target detection, wall check
│   ├── commandExecution.ts # CommandType enum + Command type + createCommand factory
│   └── robotController.ts  # Zustand store (SimulatorStore) — wires everything together
│
├── lessons/
│   └── lessonData.ts     # LESSONS array with CompletionRules + ArenaOverrides per lesson
│
├── scenarios/            # Arena loader + importable example scenarios
│   ├── arenaLoader.ts    # mergeArena(base, overrides) + arenaForLesson() helper
│   ├── index.ts          # Barrel export for all scenarios + FREE_PLAY_SCENARIOS registry
│   └── examples/
│       ├── defaultArenaScenario.ts  # Beginner: default sandbox arena
│       ├── straightLineScenario.ts  # Beginner: clear straight path to target
│       └── mazeLiteScenario.ts      # Intermediate: three-obstacle corridor
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
- `ArenaOverrides`: partial override type (size, obstacles, targets, colors)

### `scenarios/arenaLoader.ts`
Data-driven arena assembly:
- `mergeArena(base, overrides)` — shallow-merges overrides on top of a base `ArenaConfig`
- `arenaForLesson(lesson)` — convenience wrapper: `mergeArena(DEFAULT_ARENA, lesson?.arenaOverrides)`

### `lessons/lessonData.ts`
Each `Lesson` now carries:
- `arenaOverrides?: ArenaOverrides` — per-lesson obstacle/target layout
- `completionRules?: CompletionRules` — explicit success conditions (AND semantics: **all** enabled flags must pass):
  - `reachTarget` — robot must reach the target zone
  - `avoidCollision` — robot must not hit any obstacle
  - `makeAtLeastOneTurn` — robot must turn at least once
  - `completeQueue` — command queue must run to completion

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
The single source of truth for all simulator state. New in PR #4:
- `lessonStatus: LessonStatus` — `'not_started' | 'in_progress' | 'completed' | 'failed'`
- `hasTurned: boolean` — tracks whether the robot has turned (feeds `makeAtLeastOneTurn` rule)
- `queueEverCompleted: boolean` — tracks whether the queue ran to completion (feeds `completeQueue` rule)
- `setActiveLesson(id)` — now also applies the lesson's arena overrides and resets the robot pose
- `restartLesson()` — restores lesson-specific arena + robot pose + clears completion-rule trackers
- Auto-completes lessons when all `CompletionRules` are satisfied
- Auto-fails lessons when `avoidCollision` is required and a collision occurs

Added in PR #5:
- `activeScenarioId: string | null` — ID of the active free-play scenario (`null` when a lesson is running)
- `loadScenario(id)` — loads a free-play scenario by ID: resets arena, robot pose, queue, lesson state, and logs an event

## Lesson Status Lifecycle

```
setActiveLesson(id)
       │
       ▼
 lessonStatus = 'not_started'
       │
  (first action)
       ▼
 lessonStatus = 'in_progress'
       │
  ┌────┴─────────────┐
  │ avoidCollision   │ all rules satisfied
  │ + collision      │
  ▼                  ▼
'failed'         'completed'
```

## Data Flow

```
User Input (key / button)
       │
       ▼
useSimulatorStore action
  (moveForward, addCommand, loadScenario, etc.)
       │
       ▼
Zustand State Update
  + lesson-rule evaluation
  + arena = mergeArena(DEFAULT_ARENA, lesson.arenaOverrides)   [lesson mode]
  + arena = scenario.arena                                     [free-play mode]
       │
       ▼
React re-render
  ├── Arena3D (useFrame reads robot state each frame)
  ├── RobotControls (reads robot.health, robot.isRunningQueue)
  ├── CommandQueue (reads commandQueue, currentCommandIndex)
  ├── ScenarioSelector (reads activeScenarioId, activeLesson; calls loadScenario)
  ├── LessonsSidebar (reads completedLessons, lessonStatus, completionRules)
  └── TelemetryPanel (reads simState, activeScenarioId, activeLesson, lessonStatus)
```

## 3D Rendering

`Arena3D.tsx` uses `@react-three/fiber` (`Canvas`, `useFrame`) and `@react-three/drei` (`Box`, `Cylinder`, `Grid`, `OrbitControls`).

The `Robot` component reads position/rotation from Zustand on every frame via `useFrame`, enabling smooth visual updates without causing unnecessary React re-renders.

Arena3D is **dynamically imported** in the simulator page with `ssr: false` to prevent Three.js from running on the server during static generation.

## State Persistence

Lesson completion is stored in `localStorage` under the key `robo-web-sim-completed-lessons`. All localStorage access is guarded with `typeof window !== 'undefined'` for SSR compatibility.

## Scenario Examples

Three importable free-play scenarios live in `src/scenarios/examples/` and are registered in `FREE_PLAY_SCENARIOS`:

| Scenario | ID | Difficulty | Description |
|----------|----|------------|-------------|
| `defaultArenaScenario` | `default-arena` | beginner | Default sandbox: two obstacles, one target |
| `straightLineScenario` | `example-straight-line` | beginner | Clear path; press Forward to win |
| `mazeLiteScenario` | `example-maze-lite` | intermediate | Three-obstacle corridor requiring turns |

Each `ScenarioExample` carries: `id`, `title`, `description`, `difficulty`, `startPose`, and a full `arena`.
`loadScenario(id)` in the Zustand store switches the active arena + robot pose, clears lesson state, and logs an event.

The `ScenarioSelector` component (left sidebar) exposes all `FREE_PLAY_SCENARIOS` with:
- Metadata preview: description, target count, obstacle count, arena size, difficulty badge
- A "Load Scenario" button that calls `loadScenario`
- Clear visual distinction between **Free Play** mode (scenario active) and **Lesson** mode

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
