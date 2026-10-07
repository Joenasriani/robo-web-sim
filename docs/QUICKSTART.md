# Quick Start Guide

## Prerequisites

- Node.js supported by the current RoboWebSim dependency tree
- npm
- A modern browser with WebGL support

## Installation

```bash
git clone https://github.com/Joenasriani/robo-web-sim.git
cd robo-web-sim
npm install
```

## Development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Production build

```bash
npm run build
npm start
```

## Validation

Before proposing a change, run:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

## Main routes

### `/`

Project introduction and entry points to the simulator and lessons.

### `/simulator`

The main robotics workspace. Depending on viewport and active mode, it provides access to:

- the 3D arena
- robot movement controls
- Blockly programming
- the command queue
- run / pause / stop controls
- lesson and scenario selection
- arena editing tools
- model-library placement
- sensor/telemetry information
- event feedback

### `/lessons`

Lesson browser and local progress view.

## First robot program

1. Open `/simulator`.
2. Load a beginner free-play scenario.
3. Add movement blocks in Blockly.
4. Run the program.
5. Watch the command queue and robot execute the same native command sequence.
6. Observe whether the robot reaches the target, collides, or remains active.

## Direct controls

RoboWebSim supports direct movement controls alongside programmed execution. Current native robot actions include:

- forward
- backward
- turn left
- turn right
- wait

Keyboard and visible-control availability can vary with the active layout and focused UI area.

## Persistence

RoboWebSim stores supported progress, saved scenes, and saved command programs in browser `localStorage`.

There is currently no account or cloud-sync requirement.

## Deployment

RoboWebSim is a standard Next.js application and can be deployed using a platform that supports its current Next.js version.

The repository does not require environment variables for its current browser-first simulator workflow unless future features introduce them.
