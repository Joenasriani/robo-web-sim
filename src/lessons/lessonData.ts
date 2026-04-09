export interface LessonStep {
  instruction: string;
}

export interface LessonStartPose {
  position: { x: number; y: number; z: number };
  rotation: number; // radians, Y-axis
}

export interface Lesson {
  id: string;
  title: string;
  objective: string;
  steps: LessonStep[];
  successCondition: string;
  hint: string;
  /** Robot's starting pose for this lesson; used by restartLesson for deterministic reset. Falls back to INITIAL_ROBOT_STATE if omitted. */
  startPose?: LessonStartPose;
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
  },
];
