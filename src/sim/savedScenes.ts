/**
 * Saved-scene data types and localStorage helpers for free-play scene persistence.
 *
 * Scenes are stored locally only — no backend, no cloud sync.
 * Each saved scene records the active scenario base and the full arena state
 * (obstacles with rotation/modelId/glbUrl, and targets) so it can be restored exactly.
 */

import type { ArenaConfig } from './arenaConfig';

export interface SavedScene {
  /** Unique identifier (generated at save time). */
  id: string;
  /** User-provided display name. */
  name: string;
  /** Unix timestamp (ms) when the scene was saved. */
  savedAt: number;
  /** The free-play scenario ID that was active when the scene was saved (null = unknown). */
  scenarioBase: string | null;
  /** Full arena state including all obstacles (modelId, glbUrl, rotation) and targets. */
  arena: ArenaConfig;
}

export const PERSIST_KEY_SAVED_SCENES = 'robo-web-sim-saved-scenes';

/** Load all saved scenes from localStorage. Returns [] on error or missing key. */
export function loadSavedScenesFromStorage(): SavedScene[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_SCENES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any entries that don't pass basic validation
    return parsed.filter(isValidSavedScene);
  } catch {
    return [];
  }
}

/** Persist the full saved-scenes array to localStorage. */
export function persistSavedScenes(scenes: SavedScene[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSIST_KEY_SAVED_SCENES, JSON.stringify(scenes));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/**
 * Returns true if `value` is a structurally valid SavedScene.
 * Validates required fields and basic types; ignores unknown extra fields.
 */
export function isValidSavedScene(value: unknown): value is SavedScene {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  if (typeof s.id !== 'string' || s.id.length === 0) return false;
  if (typeof s.name !== 'string') return false;
  if (typeof s.savedAt !== 'number') return false;
  if (s.scenarioBase !== null && typeof s.scenarioBase !== 'string') return false;
  // Validate nested arena
  const arena = s.arena;
  if (!arena || typeof arena !== 'object') return false;
  const a = arena as Record<string, unknown>;
  if (typeof a.size !== 'number' || a.size <= 0) return false;
  if (!Array.isArray(a.obstacles)) return false;
  if (!Array.isArray(a.targets)) return false;
  return true;
}
