/**
 * Centralized runtime validation helpers for scenarios, lessons, and arena configs.
 *
 * All store actions that load external data (loadScenario, setActiveLesson,
 * hydrateFromStorage) use these helpers before applying any state change, so
 * invalid or missing data always falls back to the default arena gracefully.
 */

import type { ArenaConfig } from './arenaConfig';
import { FREE_PLAY_SCENARIOS } from '@/scenarios';
import { LESSONS } from '@/lessons/lessonData';

// Re-export saved-scene validator so callers only need one import
export { isValidSavedScene } from './savedScenes';
// Re-export saved-program validator so callers only need one import
export { isValidSavedProgram } from './savedPrograms';

/**
 * Returns true if `value` is a structurally valid ArenaConfig.
 * Checks for: numeric size > 0, obstacles array, targets array.
 */
export function isValidArena(value: unknown): value is ArenaConfig {
  if (!value || typeof value !== 'object') return false;
  const a = value as Record<string, unknown>;
  if (typeof a.size !== 'number' || a.size <= 0) return false;
  if (!Array.isArray(a.obstacles)) return false;
  if (!Array.isArray(a.targets)) return false;
  return true;
}

/**
 * Returns true if `id` matches a known free-play scenario.
 * Rejects nullish, non-string, empty, or unknown IDs.
 */
export function isValidScenarioId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && FREE_PLAY_SCENARIOS.some((s) => s.id === id);
}

/**
 * Returns true if `id` matches a known lesson.
 * Rejects nullish, non-string, empty, or unknown IDs.
 */
export function isValidLessonId(id: unknown): id is string {
  return typeof id === 'string' && id.length > 0 && LESSONS.some((l) => l.id === id);
}
