# Contributing to RoboWebSim

Thanks for considering a contribution.

RoboWebSim is a browser-first robotics learning simulator. Contributions should preserve its current scope: deterministic robot-command logic, browser-based 3D interaction, Blockly programming, lessons, scenarios, arena editing, virtual sensors, and local-first persistence.

## Setup

Requirements:

- Node.js supported by the current project dependency tree
- npm

```bash
npm install
npm run dev
```

## Before submitting a pull request

Run:

```bash
npm run lint
npm test -- --runInBand
npm run build
```

All three checks should pass for the exact commit being proposed.

## Good contribution areas

- lessons
- free-play scenarios
- Blockly programming
- virtual sensors
- arena objects and model-library improvements
- simulator logic
- mobile and accessibility improvements
- tests
- documentation

## Architecture boundaries

Please keep these boundaries intact unless a change explicitly requires revisiting them:

- Simulation logic belongs in `src/sim/` rather than being duplicated in UI components.
- Blockly programs convert into the simulator's native command representation.
- Lesson mode and free-play state should remain intentionally separated.
- The application is browser-first and currently does not depend on a robotics backend, ROS runtime, or native simulator.
- Do not add claims of research-grade physics, hardware control, or interoperability that the implementation does not provide.

## Pull requests

Keep pull requests focused. Include:

- what changed
- why it changed
- validation performed
- screenshots or recordings for meaningful visual/UI changes
- any known limitations

Avoid bundling unrelated refactors into feature or bug-fix pull requests.
