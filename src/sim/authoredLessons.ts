/**
 * Authored-lesson data types and localStorage helpers.
 *
 * Authored lessons are user-created lessons stored locally only — no backend,
 * no cloud sync.  Each authored lesson has the same shape as a built-in Lesson
 * plus a `createdAt` timestamp, and always uses an ID that starts with
 * `"authored-"` so it can be distinguished from built-in lessons.
 */

import type { Lesson, LessonStep, LessonStartPose, CompletionRules } from '@/lessons/lessonData';
import type { ArenaOverrides } from '@/sim/arenaConfig';

export type { LessonStep, LessonStartPose, CompletionRules, ArenaOverrides };

export interface AuthoredLesson extends Lesson {
  /** Unix timestamp (ms) when the lesson was authored. */
  createdAt: number;
}

export const PERSIST_KEY_AUTHORED_LESSONS = 'robo-web-sim-authored-lessons';

/** Load all authored lessons from localStorage. Returns [] on error or missing key. */
export function loadAuthoredLessonsFromStorage(): AuthoredLesson[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PERSIST_KEY_AUTHORED_LESSONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidAuthoredLesson);
  } catch {
    return [];
  }
}

/** Persist the full authored-lessons array to localStorage. */
export function persistAuthoredLessons(lessons: AuthoredLesson[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PERSIST_KEY_AUTHORED_LESSONS, JSON.stringify(lessons));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

/**
 * Returns true if `value` is a structurally valid AuthoredLesson.
 * Validates required fields and the basic shape of optional nested objects.
 * Unknown extra fields are ignored.
 */
export function isValidAuthoredLesson(value: unknown): value is AuthoredLesson {
  if (!value || typeof value !== 'object') return false;
  const l = value as Record<string, unknown>;

  // id must be a non-empty string starting with "authored-"
  if (typeof l.id !== 'string' || l.id.length === 0) return false;
  if (!l.id.startsWith('authored-')) return false;

  // Required string fields
  if (typeof l.title !== 'string' || l.title.trim() === '') return false;
  if (typeof l.objective !== 'string') return false;
  if (typeof l.hint !== 'string') return false;
  if (typeof l.successCondition !== 'string') return false;

  // steps array
  if (!Array.isArray(l.steps)) return false;
  for (const step of l.steps) {
    if (!step || typeof step !== 'object') return false;
    if (typeof (step as Record<string, unknown>).instruction !== 'string') return false;
  }

  // createdAt timestamp
  if (typeof l.createdAt !== 'number') return false;

  // Optional startPose
  if (l.startPose !== undefined) {
    const sp = l.startPose as Record<string, unknown>;
    if (!sp.position || typeof sp.position !== 'object') return false;
    const pos = sp.position as Record<string, unknown>;
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number') return false;
    if (typeof sp.rotation !== 'number') return false;
  }

  // Optional arenaOverrides
  if (l.arenaOverrides !== undefined) {
    const ao = l.arenaOverrides as Record<string, unknown>;
    if (ao.obstacles !== undefined && !Array.isArray(ao.obstacles)) return false;
    if (ao.targets !== undefined && !Array.isArray(ao.targets)) return false;
    // Each obstacle must have id, position array, size array
    if (Array.isArray(ao.obstacles)) {
      for (const obs of ao.obstacles) {
        if (!obs || typeof obs !== 'object') return false;
        const o = obs as Record<string, unknown>;
        if (typeof o.id !== 'string' || o.id.length === 0) return false;
        if (!Array.isArray(o.position) || o.position.length < 3) return false;
        if (!Array.isArray(o.size) || o.size.length < 3) return false;
      }
    }
    // Each target must have id, position array
    if (Array.isArray(ao.targets)) {
      for (const tgt of ao.targets) {
        if (!tgt || typeof tgt !== 'object') return false;
        const t = tgt as Record<string, unknown>;
        if (typeof t.id !== 'string' || t.id.length === 0) return false;
        if (!Array.isArray(t.position) || t.position.length < 3) return false;
      }
    }
  }

  // Optional completionRules
  if (l.completionRules !== undefined) {
    const cr = l.completionRules as Record<string, unknown>;
    const boolKeys = ['reachTarget', 'avoidCollision', 'makeAtLeastOneTurn', 'completeQueue'];
    for (const key of boolKeys) {
      if (cr[key] !== undefined && typeof cr[key] !== 'boolean') return false;
    }
  }

  return true;
}
