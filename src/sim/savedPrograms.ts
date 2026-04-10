/**
 * Saved-program data types and localStorage helpers for command-sequence persistence.
 *
 * Programs are stored locally only — no backend, no cloud sync.
 * Each saved program records the command queue so it can be restored exactly.
 *
 * Schema versioning
 * -----------------
 * Exported program files carry a `schemaVersion` field so future versions of
 * the simulator can detect incompatible changes.  The current version is 1.
 * Files without `schemaVersion` are treated as legacy v1 (backward-compatible).
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

/**
 * Versioned export payload written to a `.json` file.
 * Only the fields required to portably restore a program are included;
 * internal fields such as `id` and `updatedAt` are omitted.
 */
export interface ProgramExport {
  /** Schema version — always 1 for files produced by this simulator. */
  schemaVersion: number;
  /** User-provided display name. */
  name: string;
  /** The saved command sequence. */
  commands: Command[];
  /** Unix timestamp (ms) when the program was originally created. */
  createdAt: number;
}

/** The schema version written into every exported program file. */
export const CURRENT_SCHEMA_VERSION = 1;

/** The highest schema version this simulator knows how to import. */
export const MAX_SUPPORTED_SCHEMA_VERSION = 1;

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

// ---------------------------------------------------------------------------
// Versioned export / import helpers
// ---------------------------------------------------------------------------

/**
 * Build a versioned export payload from a SavedProgram.
 * The resulting object is safe to serialise as a portable `.json` file.
 */
export function buildProgramExport(program: SavedProgram): ProgramExport {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    name: program.name,
    commands: program.commands.map((cmd) => ({ ...cmd })),
    createdAt: program.createdAt,
  };
}

/**
 * Result returned by {@link validateImportedProgram}.
 * On success, `data` contains the minimal fields needed to call `importProgram`.
 */
export type ImportValidationResult =
  | { ok: true; data: Pick<SavedProgram, 'name' | 'commands' | 'createdAt'> }
  | { ok: false; error: string };

/**
 * Validate an unknown value parsed from an imported JSON file.
 *
 * Accepted formats
 * ----------------
 * - **Versioned** (new): `{ schemaVersion: 1, name, commands, createdAt }`
 * - **Legacy** (old):    `{ id, name, commands, createdAt, updatedAt }` (no schemaVersion)
 *
 * Returns a detailed error message on failure so the UI can surface it directly.
 */
export function validateImportedProgram(value: unknown): ImportValidationResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'File does not contain a JSON object.' };
  }

  const p = value as Record<string, unknown>;

  // --- schemaVersion check (only when field is present) ---
  if ('schemaVersion' in p) {
    if (typeof p.schemaVersion !== 'number' || !Number.isInteger(p.schemaVersion) || p.schemaVersion < 1) {
      return { ok: false, error: 'Invalid schemaVersion — must be a positive integer.' };
    }
    if (p.schemaVersion > MAX_SUPPORTED_SCHEMA_VERSION) {
      return {
        ok: false,
        error: `Unsupported schemaVersion ${p.schemaVersion} — this simulator supports up to version ${MAX_SUPPORTED_SCHEMA_VERSION}. Please update the simulator.`,
      };
    }
  }

  // --- name ---
  if (typeof p.name !== 'string' || p.name.trim() === '') {
    return { ok: false, error: 'Missing or empty "name" field.' };
  }

  // --- createdAt ---
  if (typeof p.createdAt !== 'number') {
    return { ok: false, error: 'Missing or invalid "createdAt" timestamp.' };
  }

  // --- commands ---
  if (!Array.isArray(p.commands)) {
    return { ok: false, error: 'Missing or invalid "commands" array.' };
  }

  for (let i = 0; i < p.commands.length; i++) {
    const cmd = p.commands[i];
    if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd)) {
      return { ok: false, error: `Command at index ${i} is not an object.` };
    }
    const c = cmd as Record<string, unknown>;
    if (typeof c.id !== 'string' || c.id.length === 0) {
      return { ok: false, error: `Command at index ${i} is missing a valid "id".` };
    }
    if (typeof c.type !== 'string' || !VALID_COMMAND_TYPES.has(c.type)) {
      return {
        ok: false,
        error: `Command at index ${i} has unsupported type "${c.type ?? ''}". Supported types: ${[...VALID_COMMAND_TYPES].join(', ')}.`,
      };
    }
    if (typeof c.label !== 'string') {
      return { ok: false, error: `Command at index ${i} is missing a "label" string.` };
    }
  }

  return {
    ok: true,
    data: {
      name: (p.name as string).trim(),
      commands: p.commands as Command[],
      createdAt: p.createdAt as number,
    },
  };
}
