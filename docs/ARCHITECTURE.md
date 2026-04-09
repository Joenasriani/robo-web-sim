# Architecture

## Overview

RoboWebSim is a Next.js App Router application using React Three Fiber for 3D rendering and Zustand for state management.

## Directory Structure

```
src/
  app/           - Next.js pages (App Router)
  components/    - React UI components
  sim/           - Simulation core logic
  lessons/       - Lesson data
  configs/       - Configuration
```

## Core Modules

- **robotState.ts** - Robot state types and initial values
- **arenaConfig.ts** - Arena configuration (obstacles, targets)
- **motionSystem.ts** - Movement calculations
- **collisionHelpers.ts** - Collision detection
- **commandExecution.ts** - Command types and factory
- **robotController.ts** - Zustand store (main state)

## Data Flow

User input → RobotControls/CommandQueue → useSimulatorStore → Arena3D (renders via useFrame)
