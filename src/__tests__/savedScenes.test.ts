/**
 * Tests for saved-scene store actions and validation:
 *  - saveCurrentScene persists to localStorage
 *  - loadSavedScene restores arena state
 *  - renameSavedScene updates the name
 *  - deleteSavedScene removes the scene
 *  - isValidSavedScene validates structure
 *  - loadSavedScene is no-op in lesson mode
 *  - loadSavedScene fails safely on invalid data
 */

import {
  useSimulatorStore,
  PERSIST_KEY_SAVED_SCENES,
} from '@/sim/robotController';
import { isValidSavedScene } from '@/sim/savedScenes';
import { DEFAULT_ARENA } from '@/sim/arenaConfig';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clearScenesStorage() {
  localStorage.removeItem(PERSIST_KEY_SAVED_SCENES);
}

beforeEach(() => {
  clearScenesStorage();
  // Reset store to a clean free-play state
  useSimulatorStore.setState({
    activeLesson: null,
    activeScenarioId: 'default-arena',
    arena: DEFAULT_ARENA,
    isHydrated: false,
    commandQueue: [],
    simState: 'idle',
    savedScenes: [],
    robot: {
      position: { x: 0, y: 0.25, z: 0 },
      rotation: 0,
      isMoving: false,
      isRunningQueue: false,
      isPaused: false,
      health: 'ok',
      sensors: { frontDistance: 5, leftObstacle: false, rightObstacle: false, targetDistance: 99 },
    },
  });
});

// ---------------------------------------------------------------------------
// isValidSavedScene
// ---------------------------------------------------------------------------
describe('isValidSavedScene', () => {
  const validScene = {
    id: 'scene-123',
    name: 'My Scene',
    savedAt: 1234567890,
    scenarioBase: 'default-arena',
    arena: { size: 10, obstacles: [], targets: [], wallColor: '#fff', floorColor: '#000' },
  };

  it('returns true for a well-formed scene', () => {
    expect(isValidSavedScene(validScene)).toBe(true);
  });

  it('returns true when scenarioBase is null', () => {
    expect(isValidSavedScene({ ...validScene, scenarioBase: null })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSavedScene(null)).toBe(false);
  });

  it('returns false when id is missing', () => {
    const { id: _omit, ...rest } = validScene;
    expect(isValidSavedScene(rest)).toBe(false);
  });

  it('returns false when id is empty string', () => {
    expect(isValidSavedScene({ ...validScene, id: '' })).toBe(false);
  });

  it('returns false when name is not a string', () => {
    expect(isValidSavedScene({ ...validScene, name: 42 })).toBe(false);
  });

  it('returns false when savedAt is not a number', () => {
    expect(isValidSavedScene({ ...validScene, savedAt: '2024-01-01' })).toBe(false);
  });

  it('returns false when arena is missing', () => {
    const { arena: _omit, ...rest } = validScene;
    expect(isValidSavedScene(rest)).toBe(false);
  });

  it('returns false when arena.size is not a positive number', () => {
    expect(isValidSavedScene({ ...validScene, arena: { ...validScene.arena, size: 0 } })).toBe(false);
    expect(isValidSavedScene({ ...validScene, arena: { ...validScene.arena, size: -1 } })).toBe(false);
  });

  it('returns false when arena.obstacles is not an array', () => {
    expect(isValidSavedScene({ ...validScene, arena: { ...validScene.arena, obstacles: 'bad' } })).toBe(false);
  });

  it('returns false when arena.targets is not an array', () => {
    expect(isValidSavedScene({ ...validScene, arena: { ...validScene.arena, targets: null } })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// saveCurrentScene
// ---------------------------------------------------------------------------
describe('saveCurrentScene', () => {
  it('adds a scene to savedScenes', () => {
    useSimulatorStore.getState().saveCurrentScene('Test Scene');
    expect(useSimulatorStore.getState().savedScenes).toHaveLength(1);
    expect(useSimulatorStore.getState().savedScenes[0].name).toBe('Test Scene');
  });

  it('persists to localStorage', () => {
    useSimulatorStore.getState().saveCurrentScene('Test Scene');
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_SCENES);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Test Scene');
  });

  it('records the active scenarioBase', () => {
    useSimulatorStore.getState().loadScenario('default-arena');
    useSimulatorStore.getState().saveCurrentScene('Base Test');
    const scene = useSimulatorStore.getState().savedScenes[0];
    expect(scene.scenarioBase).toBe('default-arena');
  });

  it('saves the current arena', () => {
    useSimulatorStore.getState().saveCurrentScene('Arena Test');
    const scene = useSimulatorStore.getState().savedScenes[0];
    expect(scene.arena).toEqual(useSimulatorStore.getState().arena);
  });

  it('ignores blank names', () => {
    useSimulatorStore.getState().saveCurrentScene('   ');
    expect(useSimulatorStore.getState().savedScenes).toHaveLength(0);
  });

  it('is no-op in lesson mode', () => {
    useSimulatorStore.setState({ activeLesson: 'lesson-1' });
    useSimulatorStore.getState().saveCurrentScene('Lesson Save Attempt');
    expect(useSimulatorStore.getState().savedScenes).toHaveLength(0);
  });

  it('prepends new scenes (newest first)', () => {
    useSimulatorStore.getState().saveCurrentScene('First');
    useSimulatorStore.getState().saveCurrentScene('Second');
    expect(useSimulatorStore.getState().savedScenes[0].name).toBe('Second');
    expect(useSimulatorStore.getState().savedScenes[1].name).toBe('First');
  });

  it('trims whitespace from name', () => {
    useSimulatorStore.getState().saveCurrentScene('  Trimmed  ');
    expect(useSimulatorStore.getState().savedScenes[0].name).toBe('Trimmed');
  });
});

// ---------------------------------------------------------------------------
// loadSavedScene
// ---------------------------------------------------------------------------
describe('loadSavedScene', () => {
  const testArena = {
    size: 12,
    obstacles: [{ id: 'o1', position: [1, 0.5, 1] as [number, number, number], size: [1, 1, 1] as [number, number, number], color: '#ff0000', rotation: 0.5 }],
    targets: [{ id: 't1', position: [3, 0.05, 3] as [number, number, number], radius: 0.5, color: '#00ff00' }],
    wallColor: '#888',
    floorColor: '#111',
  };

  beforeEach(() => {
    // Seed one saved scene
    useSimulatorStore.getState().saveCurrentScene('Temp');
    const id = useSimulatorStore.getState().savedScenes[0].id;
    // Manually set arena to test scene
    useSimulatorStore.setState({
      savedScenes: [{
        id,
        name: 'Custom Arena',
        savedAt: Date.now(),
        scenarioBase: 'default-arena',
        arena: testArena,
      }],
    });
  });

  it('restores the arena from the saved scene', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().loadSavedScene(id);
    const arena = useSimulatorStore.getState().arena;
    expect(arena.size).toBe(12);
    expect(arena.obstacles).toHaveLength(1);
    expect(arena.obstacles[0].rotation).toBeCloseTo(0.5, 5);
  });

  it('resets queue and sim state', () => {
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.setState({ simState: 'running' });
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().loadSavedScene(id);
    expect(useSimulatorStore.getState().commandQueue).toHaveLength(0);
    expect(useSimulatorStore.getState().simState).toBe('idle');
  });

  it('sets defaultArenaSnapshot to the loaded arena', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().loadSavedScene(id);
    expect(useSimulatorStore.getState().defaultArenaSnapshot).toEqual(testArena);
  });

  it('is no-op in lesson mode', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.setState({ activeLesson: 'lesson-1' });
    useSimulatorStore.getState().loadSavedScene(id);
    // Arena should not have changed to testArena
    expect(useSimulatorStore.getState().arena).not.toEqual(testArena);
  });

  it('does nothing for an unknown id', () => {
    const arenaBefore = useSimulatorStore.getState().arena;
    useSimulatorStore.getState().loadSavedScene('no-such-id');
    expect(useSimulatorStore.getState().arena).toEqual(arenaBefore);
  });

  it('restores scenarioBase as activeScenarioId', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().loadSavedScene(id);
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
  });
});

// ---------------------------------------------------------------------------
// renameSavedScene
// ---------------------------------------------------------------------------
describe('renameSavedScene', () => {
  beforeEach(() => {
    useSimulatorStore.getState().saveCurrentScene('Original Name');
  });

  it('renames the scene', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().renameSavedScene(id, 'New Name');
    expect(useSimulatorStore.getState().savedScenes[0].name).toBe('New Name');
  });

  it('persists the rename to localStorage', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().renameSavedScene(id, 'Persisted Name');
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_SCENES);
    const parsed = JSON.parse(raw!);
    expect(parsed[0].name).toBe('Persisted Name');
  });

  it('ignores blank names', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().renameSavedScene(id, '   ');
    expect(useSimulatorStore.getState().savedScenes[0].name).toBe('Original Name');
  });

  it('trims whitespace from the new name', () => {
    const id = useSimulatorStore.getState().savedScenes[0].id;
    useSimulatorStore.getState().renameSavedScene(id, '  Trimmed Name  ');
    expect(useSimulatorStore.getState().savedScenes[0].name).toBe('Trimmed Name');
  });
});

// ---------------------------------------------------------------------------
// deleteSavedScene
// ---------------------------------------------------------------------------
describe('deleteSavedScene', () => {
  beforeEach(() => {
    useSimulatorStore.getState().saveCurrentScene('To Delete');
    useSimulatorStore.getState().saveCurrentScene('To Keep');
  });

  it('removes the scene', () => {
    const scenes = useSimulatorStore.getState().savedScenes;
    const idToDelete = scenes.find((s) => s.name === 'To Delete')!.id;
    useSimulatorStore.getState().deleteSavedScene(idToDelete);
    const names = useSimulatorStore.getState().savedScenes.map((s) => s.name);
    expect(names).not.toContain('To Delete');
    expect(names).toContain('To Keep');
  });

  it('persists the deletion to localStorage', () => {
    const scenes = useSimulatorStore.getState().savedScenes;
    const idToDelete = scenes.find((s) => s.name === 'To Delete')!.id;
    useSimulatorStore.getState().deleteSavedScene(idToDelete);
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_SCENES);
    const parsed = JSON.parse(raw!);
    expect(parsed.map((s: { name: string }) => s.name)).not.toContain('To Delete');
  });

  it('does nothing when id does not match', () => {
    useSimulatorStore.getState().deleteSavedScene('no-such-id');
    expect(useSimulatorStore.getState().savedScenes).toHaveLength(2);
  });
});
