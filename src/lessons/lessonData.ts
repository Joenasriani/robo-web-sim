import type { ArenaOverrides } from '@/sim/arenaConfig';

export interface LessonStep {
  instruction: string;
}

export interface LessonStartPose {
  position: { x: number; y: number; z: number };
  rotation: number; // radians, Y-axis
}

/**
 * Data-driven success conditions for a lesson.
 * ALL enabled flags must be satisfied simultaneously for the lesson to be
 * auto-completed (AND semantics).  A flag set to `true` means that condition
 * is required; omitting a flag (or setting it to `false`) means it is not
 * checked.  Every enabled flag must pass — there is no OR shortcut.
 */
export interface CompletionRules {
  /** Robot must physically reach the target zone. */
  reachTarget?: boolean;
  /** Robot must finish without hitting any obstacle. */
  avoidCollision?: boolean;
  /** Robot must turn at least once (left or right). */
  makeAtLeastOneTurn?: boolean;
  /** Command queue must run to completion (not stopped midway). */
  completeQueue?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  objective: string;
  steps: LessonStep[];
  successCondition: string;
  hint: string;
  /** Robot's starting pose for this lesson; falls back to INITIAL_ROBOT_STATE if omitted. */
  startPose?: LessonStartPose;
  /** Per-lesson arena overrides merged on top of DEFAULT_ARENA. Falls back to DEFAULT_ARENA if omitted. */
  arenaOverrides?: ArenaOverrides;
  /** Explicit success conditions; defaults to { reachTarget: true } if omitted. */
  completionRules?: CompletionRules;
}

export const LESSONS: Lesson[] = [
  {
    id: 'lesson-1',
    title: 'Lesson 1: Your First Move',
    objective: 'Press Forward to move the robot toward the green target.',
    steps: [
      { instruction: 'Find the "Movement Controls" panel on the right.' },
      { instruction: 'Press "↑ Forward" 7 times to move toward the green target ahead.' },
      { instruction: 'Watch the robot move in the 3D view. The status bar shows when you arrive.' },
    ],
    successCondition: 'Robot reaches the green target marker.',
    hint: "The target is directly ahead. Keep pressing Forward until the status bar shows you've reached the target.",
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [],
      targets: [
        { id: 'target1', position: [0, 0.05, 3.5], radius: 0.6, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true },
  },
  {
    id: 'lesson-2',
    title: 'Lesson 2: Turn and Move',
    objective: 'Turn the robot to face a different direction, then move it to the target.',
    steps: [
      { instruction: 'The target is to your East (right side of the arena). You must turn to face it first.' },
      { instruction: 'Press "← Turn Left" 4 times — each press rotates 22.5°. Four presses = 90°, which rotates the robot to face East (right side of the arena).' },
      { instruction: 'Now press "↑ Forward" 6 times to reach the green target.' },
    ],
    successCondition: 'Robot reaches the target after turning at least once.',
    hint: 'Turn Left 4 times (= 90°, facing East), then Forward 6 times. Turn Left = rotating toward East.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [0, 0.5, 2], size: [1, 1, 1], color: '#ef4444' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 0], radius: 0.6, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, makeAtLeastOneTurn: true },
  },
  {
    id: 'lesson-3',
    title: 'Lesson 3: Navigate Around an Obstacle',
    objective: 'Go around the red obstacle to reach the target. Hitting it means failure.',
    steps: [
      { instruction: 'The target is at the far corner. The direct path is blocked — you must go around.' },
      { instruction: 'Turn Left 4 times to face East. Move Forward 6 times to reach x=3.' },
      { instruction: 'Turn Right 4 times to face North. Move Forward 6 times to reach the target.' },
    ],
    successCondition: 'Robot reaches the target without hitting any obstacle.',
    hint: 'Go East first (Turn Left 4×, Forward 6×), then North (Turn Right 4×, Forward 6×). Obstacles are placed away from this path.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [0, 0.5, 2], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [1.5, 0.5, 4], size: [1, 1, 1], color: '#ef4444' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 3], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, avoidCollision: true },
  },
  {
    id: 'lesson-4',
    title: 'Lesson 4: Build and Run a Command Queue',
    objective: 'Plan your full route using the Command Builder, then execute it in one go with Run Queue.',
    steps: [
      { instruction: `Find the "Command Builder" panel on the right. Click '↑ Forward' in the Command Builder to add it to the queue.` },
      { instruction: 'Build this exact sequence: Forward × 7. That\'s it — target is straight ahead.' },
      { instruction: 'Click "▶ Run Queue" in Movement Controls. Watch the robot execute every command. The queue must run all the way through.' },
    ],
    successCondition: 'Robot reaches the target by running the full command queue to completion.',
    hint: 'Add 7 Forward commands to the queue, then press Run Queue. The whole queue must finish — do not stop it early.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [-3, 0.5, 2], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [3, 0.5, -1], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [0, 0.05, 3.5], radius: 0.6, color: '#22c55e' },
      ],
    },
    completionRules: { completeQueue: true, reachTarget: true },
  },
  {
    id: 'lesson-5',
    title: 'Lesson 5: Queue a Turn-and-Move Route',
    objective: 'Use the command queue to program a path that includes turns and forward moves.',
    steps: [
      { instruction: 'Build this sequence in the Command Builder: Turn Left × 4, Forward × 5, Turn Right × 4, Forward × 7.' },
      { instruction: 'Review the list in the queue — all 20 commands should be listed. Turn Left appears 4 times at the start, then 5 Forwards, then Turn Right 4 times, then 7 Forwards.' },
      { instruction: 'Press "▶ Run Queue". Watch the robot turn East, drive East, turn North, drive to the target.' },
    ],
    successCondition: 'Robot reaches the target by running a queued route that includes turns.',
    hint: 'Turn Left 4× (faces East), Forward 5× (x=2.5), Turn Right 4× (faces North), Forward 7× (z=3.5). Total: 20 commands.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: Math.PI },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [0, 0.5, -1.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2.5, 0.5, 1.5], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [2.5, 0.05, 3.5], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { completeQueue: true, reachTarget: true, makeAtLeastOneTurn: true },
  },
  {
    id: 'lesson-6',
    title: 'Lesson 6: Avoid Obstacles Without Hitting Any',
    objective: 'Navigate a multi-obstacle arena to the target — without touching a single obstacle.',
    steps: [
      { instruction: 'An obstacle blocks the path directly ahead. You cannot go straight — you must detour.' },
      { instruction: 'Turn Right 4 times to face West. Move Forward 4 times to clear the obstacle.' },
      { instruction: 'Turn Left 4 times to face North. Move Forward 5 times to reach the target.' },
    ],
    successCondition: 'Robot reaches the target without hitting any obstacle.',
    hint: 'Forward 2, Turn Right 4× (West), Forward 4, Turn Left 4× (North), Forward 5. Obstacle is at (0, z=2) — the West detour clears it.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [0, 0.5, 2], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [2, 0.5, 3.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs3', position: [-3, 0.5, -2], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [-2, 0.05, 3.5], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, avoidCollision: true, makeAtLeastOneTurn: true },
  },
  {
    id: 'lesson-7',
    title: 'Lesson 7: Read the Telemetry Sensors',
    objective: 'Use the Telemetry panel to guide your robot — watch Front Distance and Target Distance to navigate safely.',
    steps: [
      { instruction: 'Open the Telemetry panel. It shows Front Distance (how far the nearest wall/obstacle is ahead) and Target Distance (how far the target is).' },
      { instruction: 'Before moving, turn until Front Distance is above 3.0. That means clear path ahead.' },
      { instruction: 'Move Forward and watch Target Distance decrease. Stop when it reaches 0 — that\'s the target. Avoid touching any red obstacle or you fail.' },
    ],
    successCondition: 'Robot reaches the target without any collisions — using sensors to guide navigation.',
    hint: 'There is no fixed route — use your sensors. Turn until Front Distance is high, then move. Watch Target Distance shrink as you approach the goal.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [1.5, 0.5, 1.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-1.5, 0.5, 2.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs3', position: [3, 0.5, -1.5], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 3], radius: 0.6, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, avoidCollision: true },
  },
  {
    id: 'lesson-8',
    title: 'Lesson 8: Full Autonomous Program',
    objective: 'Write and execute a complete queued program that navigates the full obstacle course without stopping.',
    steps: [
      { instruction: 'Study the arena — the target is at East-North. The direct North path is blocked.' },
      { instruction: 'Build the full program in Command Builder: Turn Left × 4, Forward × 4, Turn Right × 4, Forward × 4. That is 16 commands total.' },
      { instruction: 'Press "▶ Run Queue". Do not press Pause or Stop — the full queue must run uninterrupted to completion.' },
    ],
    successCondition: 'Robot reaches the target by running the full 16-command queue without stopping, having turned at least once.',
    hint: 'Turn Left 4× (East), Forward 4× (x=2.0), Turn Right 4× (North), Forward 4× (z=2.0) — robot arrives at target (2,2). All 16 commands must complete.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [0, 0.5, 1.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2, 0.5, 2], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [2, 0.05, 2], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { completeQueue: true, reachTarget: true, makeAtLeastOneTurn: true },
  },
];
