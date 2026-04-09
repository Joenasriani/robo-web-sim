/**
 * Example scenario: Maze-lite navigation.
 *
 * Three obstacles are placed in an offset corridor.  The robot must alternate
 * between forward moves and turns to thread through without collision.
 * Good for demonstrating the avoid-collision completion rule.
 */
import type { ScenarioExample } from './straightLineScenario';

export const mazeLiteScenario: ScenarioExample = {
  id: 'example-maze-lite',
  title: 'Maze-Lite Navigation',
  description:
    'Thread through three offset obstacles to reach the target. Plan your route carefully!',
  startPose: {
    position: { x: -3, y: 0.25, z: -3 },
    rotation: 0,
  },
  arena: {
    size: 10,
    obstacles: [
      { id: 'wall-a', position: [-1, 0.5,  0], size: [1, 1, 3], color: '#ef4444' },
      { id: 'wall-b', position: [ 1, 0.5,  2], size: [1, 1, 2], color: '#ef4444' },
      { id: 'wall-c', position: [-2, 0.5,  3], size: [2, 1, 1], color: '#ef4444' },
    ],
    targets: [
      { id: 'target1', position: [3, 0.05, 4], radius: 0.6, color: '#22c55e' },
    ],
    wallColor: '#475569',
    floorColor: '#0f172a',
  },
};
