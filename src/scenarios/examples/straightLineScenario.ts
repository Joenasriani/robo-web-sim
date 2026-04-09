/**
 * Example scenario: Straight-line approach.
 *
 * Robot starts at origin facing +Z.  The target is placed directly ahead with
 * no obstacles in the path — a clean "press Forward five times" exercise.
 * Useful as a beginner demo or unit-test fixture.
 */
import type { ArenaConfig } from '@/sim/arenaConfig';
import type { LessonStartPose } from '@/lessons/lessonData';

export interface ScenarioExample {
  id: string;
  title: string;
  description: string;
  startPose: LessonStartPose;
  arena: ArenaConfig;
}

export const straightLineScenario: ScenarioExample = {
  id: 'example-straight-line',
  title: 'Straight-Line Approach',
  description:
    'Clear path to the target — press Forward repeatedly until you reach the green circle.',
  startPose: {
    position: { x: 0, y: 0.25, z: 0 },
    rotation: 0,
  },
  arena: {
    size: 10,
    obstacles: [
      { id: 'deco-left',  position: [-3, 0.5, 2],  size: [1, 1, 1], color: '#f97316' },
      { id: 'deco-right', position: [ 3, 0.5, 2],  size: [1, 1, 1], color: '#f97316' },
    ],
    targets: [
      { id: 'target1', position: [0, 0.05, 4], radius: 0.6, color: '#22c55e' },
    ],
    wallColor: '#94a3b8',
    floorColor: '#1e293b',
  },
};
