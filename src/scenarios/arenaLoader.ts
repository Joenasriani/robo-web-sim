import { ArenaConfig, ArenaOverrides, DEFAULT_ARENA } from '@/sim/arenaConfig';

/**
 * Merge a base ArenaConfig with optional per-lesson overrides.
 * Any field present in `overrides` replaces the corresponding field in `base`.
 * Omitted override fields fall back to `base` values.
 *
 * Usage: mergeArena(DEFAULT_ARENA, lesson.arenaOverrides) → activeArena
 */
export function mergeArena(base: ArenaConfig, overrides?: ArenaOverrides): ArenaConfig {
  if (!overrides) return base;
  return {
    size:      overrides.size      ?? base.size,
    obstacles: overrides.obstacles ?? base.obstacles,
    targets:   overrides.targets   ?? base.targets,
    wallColor: overrides.wallColor ?? base.wallColor,
    floorColor: overrides.floorColor ?? base.floorColor,
  };
}

/**
 * Convenience helper: build the active arena for a lesson.
 * Falls back to DEFAULT_ARENA when no overrides are defined.
 */
export function arenaForLesson(
  lesson: { arenaOverrides?: ArenaOverrides } | undefined
): ArenaConfig {
  return mergeArena(DEFAULT_ARENA, lesson?.arenaOverrides);
}
