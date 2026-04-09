# Implementation Notes

## Repository Audit

The repository was found to contain only a single `README.md` file with placeholder text ("Robot simulation"). The entire application was built from scratch.

## Key Technical Decisions

### SSR Safety
`Arena3D` uses Three.js which cannot run server-side. It is dynamically imported in `src/app/simulator/page.tsx` using `next/dynamic` with `{ ssr: false }`. All localStorage access in the Zustand store is guarded with `typeof window !== 'undefined'`.

### Collision Detection
- **Obstacles**: AABB (Axis-Aligned Bounding Box) with a 0.3-unit robot radius buffer
- **Targets**: Circle radius check with a 0.3-unit buffer
- **Arena walls**: Hard boundary clamp — the robot stops 0.3 units from each wall and registers a collision

### Command Queue Execution
`runQueue()` is an async method on the Zustand store. It loops through queued commands with a 600ms delay between each execution. Pause/stop is checked on each iteration. The `currentCommandIndex` state variable drives visual highlighting in the queue UI.

### Robot Rendering
The `Robot` component in `Arena3D.tsx` reads position and rotation from Zustand state inside a `useFrame` callback. This updates the Three.js `Group` transform directly every frame without triggering React re-renders, keeping rendering smooth.

### Lesson Completion Flow
1. User moves robot → Zustand store checks collisions after every move
2. If `robot.health === 'reached_target'`, the LessonsSidebar shows a "Mark as Complete" button
3. Clicking it calls `completeLesson(lessonId)`, which saves to localStorage
4. The `/lessons` page reads `completedLessons` from the same Zustand store

### State Architecture
A single Zustand store (`useSimulatorStore`) holds all runtime state:
- Robot position, rotation, health, flags
- Arena configuration (obstacles, targets)
- Command queue and execution index
- Completed lessons (with localStorage sync)

This avoids prop drilling and keeps the simulation state accessible from any component.

## Known Limitations

- Arena configuration is static (not editable at runtime via UI)
- No undo for individual command queue items (only remove-last or clear-all)
- Robot movement is step-based (no physics, no inertia)
- No save/load for command sequences
- Lessons sidebar is hidden on screens narrower than `lg` (1024px) — no mobile controls panel

## Files Created

| File | Description |
|------|-------------|
| `src/app/page.tsx` | Landing page |
| `src/app/layout.tsx` | Root layout |
| `src/app/globals.css` | Tailwind + custom component classes |
| `src/app/simulator/page.tsx` | Simulator page |
| `src/app/lessons/page.tsx` | Lessons page |
| `src/components/Arena3D.tsx` | Three.js 3D arena |
| `src/components/RobotControls.tsx` | D-pad + play/pause/stop |
| `src/components/CommandQueue.tsx` | Command builder + queue UI |
| `src/components/LessonsSidebar.tsx` | Lessons sidebar with completion |
| `src/sim/robotState.ts` | Robot state types |
| `src/sim/arenaConfig.ts` | Arena configuration |
| `src/sim/motionSystem.ts` | Movement calculations |
| `src/sim/collisionHelpers.ts` | Collision detection |
| `src/sim/commandExecution.ts` | Command types and factory |
| `src/sim/robotController.ts` | Zustand store |
| `src/lessons/lessonData.ts` | Lesson content |
| `src/configs/simulatorConfig.ts` | Simulator constants |
| `docs/QUICKSTART.md` | Quick start guide |
| `docs/ARCHITECTURE.md` | Architecture overview |
| `docs/LESSONS.md` | Lessons reference |
| `README.md` | Full project documentation |
