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
      { instruction: 'When an obstacle is in your path, turn left or right to go around it.' },
      { instruction: 'After clearing the obstacle, straighten your path and head for the target.' },
    ],
    successCondition: 'Robot reaches the target without hitting any obstacles.',
    hint: 'Try moving forward a couple steps, turning left to go around the red box, then turning right and heading for the target.',
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
];
