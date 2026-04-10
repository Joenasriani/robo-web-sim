/**
 * Smoke tests for the validation helpers.
 */

import { isValidArena, isValidScenarioId, isValidLessonId } from '@/sim/validation';
import { FREE_PLAY_SCENARIOS } from '@/scenarios';
import { LESSONS } from '@/lessons/lessonData';

describe('isValidArena', () => {
  it('returns true for a well-formed arena', () => {
    expect(isValidArena({ size: 10, obstacles: [], targets: [], wallColor: '#fff', floorColor: '#000' })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidArena(null)).toBe(false);
  });

  it('returns false when size is missing', () => {
    expect(isValidArena({ obstacles: [], targets: [] })).toBe(false);
  });

  it('returns false when size is zero', () => {
    expect(isValidArena({ size: 0, obstacles: [], targets: [] })).toBe(false);
  });

  it('returns false when size is negative', () => {
    expect(isValidArena({ size: -5, obstacles: [], targets: [] })).toBe(false);
  });

  it('returns false when obstacles is missing', () => {
    expect(isValidArena({ size: 10, targets: [] })).toBe(false);
  });

  it('returns false when targets is missing', () => {
    expect(isValidArena({ size: 10, obstacles: [] })).toBe(false);
  });

  it('returns false for a non-object', () => {
    expect(isValidArena('arena')).toBe(false);
    expect(isValidArena(42)).toBe(false);
    expect(isValidArena(undefined)).toBe(false);
  });
});

describe('isValidScenarioId', () => {
  it('returns true for every known scenario id', () => {
    for (const s of FREE_PLAY_SCENARIOS) {
      expect(isValidScenarioId(s.id)).toBe(true);
    }
  });

  it('returns false for an unknown id', () => {
    expect(isValidScenarioId('no-such-scenario')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidScenarioId(null)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidScenarioId('')).toBe(false);
  });
});

describe('isValidLessonId', () => {
  it('returns true for every known lesson id', () => {
    for (const l of LESSONS) {
      expect(isValidLessonId(l.id)).toBe(true);
    }
  });

  it('returns false for an unknown id', () => {
    expect(isValidLessonId('lesson-999')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidLessonId(null)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidLessonId('')).toBe(false);
  });
});
