# RoboWebSim 🤖

A beginner-friendly, browser-based robotics simulator built with Next.js, Three.js, and React Three Fiber.

## Features

- **3D Arena**: Interactive Three.js arena with obstacles and target markers
- **Direct Control**: Arrow keys or on-screen buttons for real-time robot control
- **Command Queue**: Build and run automated sequences of movement commands
- **Guided Lessons**: 3 beginner lessons on navigation, turning, and obstacle avoidance
- **Progress Tracking**: Lesson completion saved to localStorage

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Three.js + React Three Fiber + @react-three/drei
- Zustand

## Project Structure

```
src/
  app/           # Pages: /, /simulator, /lessons
  components/    # Arena3D, RobotControls, CommandQueue, LessonsSidebar
  sim/           # Simulation core: state, motion, collision, store
  lessons/       # Lesson data
  configs/       # Simulator config
docs/            # Documentation
examples/        # Example configurations
scripts/         # Utility scripts
```

## Keyboard Controls

| Key | Action |
|-----|--------|
| ↑ | Move Forward |
| ↓ | Move Backward |
| ← | Turn Left |
| → | Turn Right |

## Documentation

- [Quick Start](docs/QUICKSTART.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Lessons](docs/LESSONS.md)
- [Implementation Notes](IMPLEMENTATION_NOTES.md)
