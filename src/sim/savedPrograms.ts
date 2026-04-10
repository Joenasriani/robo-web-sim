/**
 * Saved-program data types and localStorage helpers for command-sequence persistence.
 *
 * Programs are stored locally only — no backend, no cloud sync.
 * Each saved program records the command queue so it can be restored exactly.
 */

import type { Command, CommandType } from './commandExecution';

export interface SavedProgram {
  /** Unique identifier (generated at save time). */
  id: string;
  /** User-provided display name. */
  name: string;
  /** The saved command sequence. */
  commands: Command[];
  /** Unix timestamp (ms) when the program was first created. */
  createdAt: number;
  /** Unix timestamp (ms) when the program was last updated (same as createdAt on first save). */
  updatedAt: number;
}

export const PERSIST_KEY_SAVED_PROGRAMS = 'robo-web-sim-saved-programs';

/** Valid command types recognised by the simulator. */
const VALID_COMMAND_TYPES: ReadonlySet<string> = new Set<CommandType>([
  'forward',
  'backward',
  'left',
  'right',
  'wait',
]);

/** Load all saved programs from localStorage. Returns [] on error or missing key. */
export function loadSavedProgramsFromStorage(): SavedProgram[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_PROGRAMS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Filter out any entries that don't pass basic validation
    return parsed.filter(isValidSavedProgram);
  } catch {
    return [];
  }
}

/** Persist the full saved-programs array to localStorage. */
export function persistSavedPrograms(programs: SavedProgram[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSIST_KEY_SAVED_PROGRAMS, JSON.stringify(programs));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/**
 * Returns true if `value` is a structurally valid SavedProgram.
 * Validates required fields and each command's type against the supported set.
 */
export function isValidSavedProgram(value: unknown): value is SavedProgram {
  if (!value || typeof value !== 'object') return false;
  const p = value as Record<string, unknown>;
  if (typeof p.id !== 'string' || p.id.length === 0) return false;
  if (typeof p.name !== 'string') return false;
  if (typeof p.createdAt !== 'number') return false;
  if (typeof p.updatedAt !== 'number') return false;
  if (!Array.isArray(p.commands)) return false;
  for (const cmd of p.commands) {
    if (!cmd || typeof cmd !== 'object') return false;
    const c = cmd as Record<string, unknown>;
    if (typeof c.id !== 'string' || c.id.length === 0) return false;
    if (typeof c.type !== 'string' || !VALID_COMMAND_TYPES.has(c.type)) return false;
    if (typeof c.label !== 'string') return false;
  }
  return true;
}
