export { straightLineScenario } from './examples/straightLineScenario';
export type { ScenarioExample } from './examples/straightLineScenario';
export { mazeLiteScenario } from './examples/mazeLiteScenario';
export { defaultArenaScenario } from './examples/defaultArenaScenario';
export { mergeArena, arenaForLesson } from './arenaLoader';

import type { ScenarioExample } from './examples/straightLineScenario';
import { defaultArenaScenario } from './examples/defaultArenaScenario';
import { straightLineScenario } from './examples/straightLineScenario';
import { mazeLiteScenario } from './examples/mazeLiteScenario';

/** All free-play scenarios available in the scenario selector, in display order. */
export const FREE_PLAY_SCENARIOS: ScenarioExample[] = [
  defaultArenaScenario,
  straightLineScenario,
  mazeLiteScenario,
];
