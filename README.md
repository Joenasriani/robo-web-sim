# RoboWebSim 🤖

A beginner-friendly, browser-based robotics simulator for interactive learning and research. Control a virtual robot in a 3D arena, queue commands for automated sequences, and work through guided lessons — all directly in your browser.

---

## Overview

RoboWebSim is an educational robotics simulation platform that runs entirely in the browser. It is designed for beginners learning robot movement, navigation, and simple autonomous behavior. No software installation is required beyond a web browser.

## Webots Inspiration

This project is an open-source desktop robot simulator. Webots is used only as a **conceptual reference** for:

- The separation of robot state, controller, and world (arena) configuration
- The structure of beginner-friendly simulation workflows
- How sensors, actuators, and controllers are modularly organized

**RoboWebSim is entirely original**: no Webots code, branding, UI, assets, or documentation has been copied. This is a web-first product built from scratch with Next.js and Three.js.

## What Is Original

- Browser-first architecture (no desktop app, no install)
- Original 3D robot and arena design built with React Three Fiber
- Custom simulation engine (motion, collision, command queue)
- Original lesson content and progression system
- localStorage-based progress persistence
- Custom Zustand-based state management for all simulation state

---

## Features

| Feature | Description |
|---------|-------------|
| 🤖 3D Arena | Interactive Three.js arena with grid floor, walls, obstacles, target |
| 🎮 Direct Control | Arrow keys or on-screen D-pad for real-time robot movement |
| 📋 Command Queue | Build sequences of forward/backward/left/right/wait commands and run automatically |
| 📚 Guided Lessons | 3 beginner lessons on navigation, turning, and obstacle avoidance |
| ✅ Progress Tracking | Lesson completion state saved to localStorage |
| 🎨 Collision Feedback | Robot changes color when hitting an obstacle or reaching a target |
| 🔄 Pause/Resume/Stop | Full queue execution control |
| 💾 Session Persistence | Restores last free-play scenario or lesson on reload (safe fallback to default arena) |
| 🛡 Runtime Validation | Scenario/lesson IDs and arena shapes validated before loading |
| 📱 Responsive Layout | Works on desktop, tablet, and mobile via adaptive bottom-tab panel |
| 💡 Onboarding Strip | Dismissible quick-start guide shown at the top of the simulator |

---

## Demo Guide

To quickly show off RoboWebSim to a new visitor or reviewer:

### Option A — Guided lesson demo
1. Open `/lessons` and walk through the lesson list
2. Click **Practice in Simulator** on any lesson
3. In the simulator, the lesson loads and the context bar shows **Lesson** mode
4. Add a few commands (e.g. Forward → Left → Forward) via the Command Builder
5. Click **▶ Run Queue** and watch the robot navigate
6. Observe telemetry and event log update in real time

### Option B — Free-play scenario demo
1. Open `/simulator` directly
2. The **Quick Start** strip at the top explains the 4 steps
3. In the left panel (desktop) or **Scenarios** tab (mobile), expand a scenario card and click **▶ Load Scenario**
4. Add commands and run the queue
5. Try **🔄 Reset** or **↩ Replay** from Quick Actions to demonstrate deterministic replay

### Option C — Responsive layout demo
1. Open the simulator on a desktop and note the three-column layout
2. Resize to tablet/mobile width; the canvas fills the screen and controls move to the bottom tab bar
3. Tap the **Controls**, **Queue**, and **Info** tabs to explore panels

---

## Local Setup

### Prerequisites

- Node.js 18 or newer
- npm (comes with Node.js)

### Install

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
```

### Run (development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build (production)

```bash
npm run build
npm start
```

### Run tests

```bash
npm test
```

The test suite covers store behaviors (scenario loading, lesson persistence, hydration fallback) and route smoke tests. Tests use Jest + ts-jest with a jsdom environment.

---

## Vercel Deployment

1. Push the repository to GitHub (already done)
2. Go to [vercel.com](https://vercel.com) and import the repository
3. Framework will be auto-detected as **Next.js**
4. No environment variables are required for the MVP
5. Click **Deploy**

The app is fully static-compatible and will be served via Vercel's CDN.

---

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with product intro and navigation |
| `/simulator` | 3D simulator with robot controls, command queue, and lessons sidebar |
| `/lessons` | Full lessons page with progress tracking |

---

## Keyboard Controls

| Key | Action |
|-----|--------|
| `↑` | Move forward |
| `↓` | Move backward |
| `←` | Turn left |
| `→` | Turn right |

---

## Project Structure

```
robo-web-sim/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Landing page (/)
│   │   ├── simulator/    # Simulator page (/simulator)
│   │   └── lessons/      # Lessons page (/lessons)
│   ├── components/       # React UI components
│   │   ├── Arena3D.tsx   # Three.js 3D scene
│   │   ├── RobotControls.tsx
│   │   ├── CommandQueue.tsx
│   │   └── LessonsSidebar.tsx
│   ├── sim/              # Simulation core modules
│   │   ├── robotState.ts
│   │   ├── arenaConfig.ts
│   │   ├── motionSystem.ts
│   │   ├── collisionHelpers.ts
│   │   ├── commandExecution.ts
│   │   ├── robotController.ts  # Zustand store
│   │   └── validation.ts       # Runtime validation helpers
│   ├── lessons/          # Lesson content data
│   ├── configs/          # Simulator configuration
│   └── __tests__/        # Jest smoke tests
├── docs/                 # Documentation
├── examples/             # Example arena configs
├── scripts/              # Utility scripts
└── public/               # Static assets
```

---

## Current Limitations

- Arena configuration is static (not editable at runtime via UI)
- No undo for individual command queue items (only remove-last or clear-all)
- Robot movement is grid-step-based (not continuous physics)
- No save/load for command sequences
- OrbitControls pinch-zoom uses Three.js defaults; multi-touch may feel slightly different from native apps
- Keyboard arrow key shortcuts work on mobile only with an external keyboard connected

---

## Responsive Layout

RoboWebSim adapts across screen sizes using a breakpoint-based layout strategy:

| Breakpoint | Layout |
|------------|--------|
| **Large desktop** (`lg` / 1024px+) | Full three-column layout: left sidebar (Scenarios + Lessons) · 3D canvas · right sidebar (Controls + Queue + Telemetry + Event Log) |
| **Tablet / small laptop** (`md`–`lg`) | Canvas fills full width. All panels accessible via a bottom tab bar: **Controls**, **Scenarios**, **Queue**, **Info** |
| **Mobile** (< `md`) | Same bottom-tab approach, canvas fills available height above the tab bar |

### What works everywhere
- Scenario selector, Lessons, Quick Actions, Command Queue, Telemetry, Event Log — all reachable via the bottom tab panel on smaller screens
- Canvas resizes automatically to fill the available space
- No horizontal scrolling on any supported width
- Touch-friendly tap targets (`touch-manipulation`, `min-h-[52px]` tab buttons, `active:` states on all buttons)
- Current Context panel always visible above the canvas at all sizes

### Remaining layout limitations
- OrbitControls touch-pan/pinch-zoom uses Three.js defaults; multi-touch may feel slightly different from native apps
- Keyboard arrow key shortcuts still work on mobile but are only useful when an external keyboard is connected

---

## Roadmap

Priority order for future upgrades:

1. ~~**Responsive / mobile controls** — Touch-friendly D-pad, better layout on small screens~~ ✅ Done in PR #9
2. ~~**UX polish and demo readiness** — Onboarding strip, empty states, disabled states, microcopy~~ ✅ Done in PR #10
3. **Editable arena** — Drag-and-drop obstacles and target placement
4. **Save/load command sequences** — Export and import command programs as JSON
5. **More lessons** — Sensor simulation, grid navigation, pathfinding
6. **Physics engine** — Rapier.js integration for realistic collisions and dynamics
7. **Blockly integration** — Visual programming for command sequences
8. **Multiple robot types** — Different shapes, sizes, and movement capabilities
9. **Lesson authoring** — User-created lessons with custom objectives
10. **Multiplayer / collaborative mode** — Two robots, cooperative challenges

---

## Documentation

- [Quick Start Guide](docs/QUICKSTART.md)
- [Architecture Overview](docs/ARCHITECTURE.md)
- [Lessons Reference](docs/LESSONS.md)
- [Implementation Notes](IMPLEMENTATION_NOTES.md)
