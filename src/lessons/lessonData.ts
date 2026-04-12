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
    title: 'Lesson 1: Move Forward to a Target',
    objective: 'Move the robot forward until it reaches the green target marker.',
    steps: [
      { instruction: 'Press the "Forward" button or use the ↑ key to move the robot.' },
      { instruction: 'Keep pressing Forward until the robot reaches the green circle.' },
      { instruction: 'Watch the status bar — it will tell you when you reach the target.' },
    ],
    successCondition: 'Robot reaches the green target marker.',
    hint: 'The target is ahead and to the right. Move forward several steps then turn right.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    // Lesson-specific arena: target placed ahead and to the right, one obstacle off to the side.
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [2, 0.5, 1],   size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2, 0.5, -2],  size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 3], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true },
  },
  {
    id: 'lesson-2',
    title: 'Lesson 2: Turn and Reach a Target',
    objective: 'Use turning controls to orient the robot, then move it to the target.',
    steps: [
      { instruction: 'Press "Turn Right" or "Turn Left" to rotate the robot.' },
      { instruction: 'Face the robot toward the green target marker.' },
      { instruction: 'Press "Forward" to drive toward the target.' },
    ],
    successCondition: 'Robot reaches the target after making at least one turn.',
    hint: 'Try turning right first, then move forward several steps.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    // Lesson-specific arena: obstacle in the way forces the player to turn.
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [0, 0.5, 2],   size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2, 0.5, -2],  size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 3], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, makeAtLeastOneTurn: true },
  },
  {
    id: 'lesson-3',
    title: 'Lesson 3: Avoid an Obstacle and Reach a Goal',
    objective: 'Navigate around the red obstacles and reach the green target.',
    steps: [
      { instruction: 'Move forward carefully. Red boxes are obstacles — hitting them counts as a collision.' },
      { instruction: 'When an obstacle is in your path, turn right to go around it, then turn left to straighten up toward the target.' },
      { instruction: 'After clearing the obstacle, straighten your path and head for the target.' },
    ],
    successCondition: 'Robot reaches the target without hitting any obstacles.',
    hint: 'Move forward 2 steps toward the obstacle, then turn right twice to face east. Move forward 3 steps to clear it, turn left twice to face north again, then move forward to reach the target.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    // Lesson-specific arena: extra obstacle to create a more meaningful avoidance challenge.
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [2,    0.5,  1],   size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2,   0.5, -2],   size: [1, 1, 1], color: '#f97316' },
        { id: 'obs3', position: [1.5,  0.5,  2.5], size: [1, 1, 1], color: '#ef4444' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 3], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, avoidCollision: true },
  },
  {
    id: 'lesson-4',
    title: 'Lesson 4: Queue Your Commands',
    objective: 'Use the command queue to plan a sequence of forward moves and execute them all at once.',
    steps: [
      { instruction: 'Find the Command Queue panel on the right side of the screen.' },
      { instruction: 'Click "Enqueue" next to the Forward button at least 6 times to add moves to the queue.' },
      { instruction: 'Click "▶ Run Queue" to execute all your commands at once and drive to the target.' },
    ],
    successCondition: 'Robot reaches the target by running the command queue.',
    hint: 'You need about 6 forward commands to reach the target straight ahead. Build the queue first, then run it!',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [-3, 0.5,  2],  size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [ 3, 0.5, -1],  size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [0, 0.05, 3.5], radius: 0.6, color: '#22c55e' },
      ],
    },
    completionRules: { completeQueue: true, reachTarget: true },
  },
  {
    id: 'lesson-5',
    title: 'Lesson 5: Watch the Front Distance Sensor',
    objective: 'Read the front distance sensor in the Telemetry panel to detect a nearby obstacle, then steer safely around it to reach the target.',
    steps: [
      { instruction: 'Open the Telemetry panel. Notice "Front Distance" shows about 1.5 — an obstacle is close ahead!' },
      { instruction: 'Do NOT move forward yet. Turn Right 4 times to face East.' },
      { instruction: 'Move Forward 5 times, then Turn Left 4 times to face North again.' },
      { instruction: 'Move Forward until you reach the green target — watch Target Distance shrink!' },
    ],
    successCondition: 'Robot reaches the target without hitting the obstacle.',
    hint: 'When Front Distance is below 2.0, turn before moving forward to avoid a collision.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [ 0,    0.5, 1.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2.5,  0.5, 1.5], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [2.5, 0.05, 3.5], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { avoidCollision: true, reachTarget: true },
  },
  {
    id: 'lesson-6',
    title: 'Lesson 6: Navigate the Bend',
    objective: 'Navigate around an obstacle by turning left and following a new heading to reach the target without any collisions.',
    steps: [
      { instruction: 'Move Forward 2 times toward the obstacle ahead — stop before hitting it.' },
      { instruction: 'Turn Left 4 times to face West.' },
      { instruction: 'Move Forward 4 times to clear the obstacle.' },
      { instruction: 'Turn Right 4 times to face North again, then move Forward to the green target.' },
    ],
    successCondition: 'Robot reaches the target without hitting any obstacle.',
    hint: 'The target is to the left of the blocking obstacle. Turn left to go around, straighten up, then drive forward.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [ 0,   0.5, 2],   size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [ 2,   0.5, 3.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs3', position: [-3,   0.5, -2],  size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [-2, 0.05, 3.5], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, avoidCollision: true, makeAtLeastOneTurn: true },
  },
  {
    id: 'lesson-7',
    title: 'Lesson 7: Navigate Using All Sensors',
    objective: 'Use the Telemetry panel — front distance, side sensors, and target distance — to navigate a complex arena. No fixed route is given; use your sensors!',
    steps: [
      { instruction: 'Open the Telemetry panel and study the sensor readings at your starting position.' },
      { instruction: 'Rotate until "Front Distance" is large (clear path) and note "Target Distance".' },
      { instruction: 'Move Forward carefully. Watch "Left Sensor" and "Right Sensor" to avoid walls.' },
      { instruction: 'Keep adjusting heading and moving forward until Target Distance reaches zero.' },
    ],
    successCondition: 'Robot reaches the target using sensor-guided navigation.',
    hint: 'Face a direction where Front Distance is high, then move. Keep rotating and moving to minimize Target Distance.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [ 1.5, 0.5,  1.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-1.5, 0.5,  2.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs3', position: [ 3,   0.5, -1.5], size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [3, 0.05, 3], radius: 0.6, color: '#22c55e' },
      ],
    },
    completionRules: { reachTarget: true, avoidCollision: true },
  },
  {
    id: 'lesson-8',
    title: 'Lesson 8: Automate the Full Route',
    objective: 'Build a complete program in the command queue — including turns — and execute it in one go to navigate the full path to the target.',
    steps: [
      { instruction: 'Open the Command Queue panel. The target is to the right and ahead — you cannot go straight.' },
      { instruction: 'Queue your program: 4 × Turn Right → 4 × Forward → 4 × Turn Left → 4 × Forward.' },
      { instruction: 'Review the queue list, then click "▶ Run Queue" to run your full program.' },
    ],
    successCondition: 'Robot reaches the target by running a queued program that includes at least one turn.',
    hint: 'Think of the queue like writing code: plan the whole route first, then execute. You need at least one turn in the queue.',
    startPose: { position: { x: 0, y: 0.25, z: 0 }, rotation: 0 },
    arenaOverrides: {
      obstacles: [
        { id: 'obs1', position: [ 0,  0.5, 1.5], size: [1, 1, 1], color: '#ef4444' },
        { id: 'obs2', position: [-2,  0.5, 2],   size: [1, 1, 1], color: '#f97316' },
      ],
      targets: [
        { id: 'target1', position: [2, 0.05, 2], radius: 0.5, color: '#22c55e' },
      ],
    },
    completionRules: { completeQueue: true, reachTarget: true, makeAtLeastOneTurn: true },
  },
];
