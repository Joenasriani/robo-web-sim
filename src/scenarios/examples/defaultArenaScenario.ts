/**
 * Default arena scenario: free-play starting configuration.
 *
 * Mirrors DEFAULT_ARENA exactly — two side obstacles and one target —
 * giving users an open sandbox to explore controls without any lesson
 * constraints active.
 */
import type { ScenarioExample } from './straightLineScenario';
import { DEFAULT_ARENA } from '@/sim/arenaConfig';

export const defaultArenaScenario: ScenarioExample = {
  id: 'default-arena',
  title: 'Default Arena',
  description:
    'Open sandbox arena — two obstacles and one target. Great for exploring controls freely.',
  difficulty: 'beginner',
  startPose: {
    position: { x: 0, y: 0.25, z: 0 },
    rotation: 0,
  },
  arena: DEFAULT_ARENA,
};
