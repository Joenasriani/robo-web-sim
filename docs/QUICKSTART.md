# Quick Start Guide

## Prerequisites

- Node.js 18 or newer
- npm (bundled with Node.js)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
```

## Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production Build

```bash
npm run build
npm start
```

## Vercel Deployment

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Framework preset: **Next.js** (auto-detected)
4. No environment variables needed for MVP
5. Click **Deploy**

## What You'll See

### Landing Page (`/`)
- Product overview, feature highlights
- **Launch Simulator** button → opens 3D arena
- **Open Lessons** button → opens lessons page

### Simulator Page (`/simulator`)
Three-column layout:
- **Left sidebar**: Lesson objectives and progress
- **Center**: 3D arena (drag to orbit, scroll to zoom)
- **Right sidebar**: Movement controls + command queue builder

### Lessons Page (`/lessons`)
- Full list of all beginner lessons
- Progress bar showing completion count
- Links back to simulator for practice

## Controls

| Action | Control |
|--------|---------|
| Move Forward | ↑ Arrow key or Forward button |
| Move Backward | ↓ Arrow key or Back button |
| Turn Left | ← Arrow key or Left button |
| Turn Right | → Arrow key or Right button |
| Reset Robot | Reset button |
| Run Command Queue | "Run Queue" button |
| Pause Queue | "Pause" button while queue runs |
| Stop Queue | "Stop" button while queue runs |

## Tips

- The robot body turns **green** when it reaches a target and **red** when it hits an obstacle
- The yellow protrusion on the robot shows which direction it is facing
- Use the command queue to program multi-step paths before running them
