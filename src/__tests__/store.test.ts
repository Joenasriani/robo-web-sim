/**
 * Smoke tests for Zustand store behaviors:
 *  - loadScenario falls back to default-arena when given an invalid ID
 *  - setActiveLesson persists to localStorage
 *  - hydrateFromStorage falls back to default-arena for bad data
 *  - queue does not auto-resume after hydration
 */

import { PERSIST_KEY_MODE, PERSIST_KEY_SCENARIO, PERSIST_KEY_LESSON, PERSIST_KEY_DEMO_MODE, useSimulatorStore } from '@/sim/robotController';

// ---------------------------------------------------------------------------
// localStorage mock (provided by jest-environment-jsdom)
// ---------------------------------------------------------------------------
function setStorage(mode: string | null, scenario: string | null, lesson: string | null) {
  if (mode === null) localStorage.removeItem(PERSIST_KEY_MODE);
  else localStorage.setItem(PERSIST_KEY_MODE, mode);

  if (scenario === null) localStorage.removeItem(PERSIST_KEY_SCENARIO);
  else localStorage.setItem(PERSIST_KEY_SCENARIO, scenario);

  if (lesson === null) localStorage.removeItem(PERSIST_KEY_LESSON);
  else localStorage.setItem(PERSIST_KEY_LESSON, lesson);
}

function clearStorage() {
  localStorage.removeItem(PERSIST_KEY_MODE);
  localStorage.removeItem(PERSIST_KEY_SCENARIO);
  localStorage.removeItem(PERSIST_KEY_LESSON);
}

beforeEach(() => {
  clearStorage();
  // Reset the store back to a clean initial-like state between tests
  useSimulatorStore.setState({
    activeLesson: null,
    activeScenarioId: 'default-arena',
    isHydrated: false,
    commandQueue: [],
    simState: 'idle',
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
// loadScenario
// ---------------------------------------------------------------------------
describe('loadScenario', () => {
  it('loads a known scenario correctly', () => {
    useSimulatorStore.getState().loadScenario('example-straight-line');
    expect(useSimulatorStore.getState().activeScenarioId).toBe('example-straight-line');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });

  it('falls back to default-arena when given an unknown id', () => {
    useSimulatorStore.getState().loadScenario('completely-made-up-scenario');
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
  });

  it('resets queue and sim state when loading a scenario', () => {
    // Put something in the queue first
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.setState({ simState: 'running' });

    useSimulatorStore.getState().loadScenario('default-arena');

    expect(useSimulatorStore.getState().commandQueue).toHaveLength(0);
    expect(useSimulatorStore.getState().simState).toBe('idle');
  });

  it('persists free_play mode to localStorage', () => {
    useSimulatorStore.getState().loadScenario('example-straight-line');
    expect(localStorage.getItem(PERSIST_KEY_MODE)).toBe('free_play');
    expect(localStorage.getItem(PERSIST_KEY_SCENARIO)).toBe('example-straight-line');
    expect(localStorage.getItem(PERSIST_KEY_LESSON)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setActiveLesson
// ---------------------------------------------------------------------------
describe('setActiveLesson', () => {
  it('loads a known lesson', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    expect(useSimulatorStore.getState().activeLesson).toBe('lesson-1');
    expect(useSimulatorStore.getState().activeScenarioId).toBeNull();
  });

  it('falls back to default-arena when given an unknown lesson id', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-999');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
  });

  it('persists lesson mode to localStorage', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    expect(localStorage.getItem(PERSIST_KEY_MODE)).toBe('lesson');
    expect(localStorage.getItem(PERSIST_KEY_LESSON)).toBe('lesson-1');
    expect(localStorage.getItem(PERSIST_KEY_SCENARIO)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// hydrateFromStorage
// ---------------------------------------------------------------------------
describe('hydrateFromStorage', () => {
  it('restores a free-play scenario from storage', () => {
    setStorage('free_play', 'example-straight-line', null);
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().activeScenarioId).toBe('example-straight-line');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });

  it('restores a lesson from storage', () => {
    setStorage('lesson', null, 'lesson-1');
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().activeLesson).toBe('lesson-1');
  });

  it('falls back to default-arena when stored scenario id is invalid', () => {
    setStorage('free_play', 'no-such-scenario', null);
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });

  it('falls back to default-arena when stored lesson id is invalid', () => {
    setStorage('lesson', null, 'lesson-999');
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });

  it('falls back to default-arena when storage is empty', () => {
    clearStorage();
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });

  it('sets isHydrated to true after hydration', () => {
    expect(useSimulatorStore.getState().isHydrated).toBe(false);
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().isHydrated).toBe(true);
  });

  it('does not auto-resume an in-flight queue after hydration', () => {
    setStorage('free_play', 'example-straight-line', null);
    // Simulate a queue with commands
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('forward');
    // Hydrate — must NOT auto-start the queue
    useSimulatorStore.getState().hydrateFromStorage();
    const state = useSimulatorStore.getState();
    expect(state.robot.isRunningQueue).toBe(false);
    expect(state.simState).toBe('idle');
  });
});

// ---------------------------------------------------------------------------
// Arena editor
// ---------------------------------------------------------------------------
describe('arena editor', () => {
  beforeEach(() => {
    // Ensure we are in free-play mode with a known scenario loaded
    useSimulatorStore.getState().loadScenario('default-arena');
  });

  it('setEditMode enables and disables edit mode', () => {
    useSimulatorStore.getState().setEditMode(true);
    expect(useSimulatorStore.getState().isEditMode).toBe(true);

    useSimulatorStore.getState().setEditMode(false);
    expect(useSimulatorStore.getState().isEditMode).toBe(false);
  });

  it('setEditMode(false) clears selectedEditObject', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    expect(useSimulatorStore.getState().selectedEditObject).not.toBeNull();

    useSimulatorStore.getState().setEditMode(false);
    expect(useSimulatorStore.getState().selectedEditObject).toBeNull();
  });

  it('selectEditObject and deselectEditObject work correctly', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    expect(useSimulatorStore.getState().selectedEditObject).toEqual({ type: 'obstacle', id: 'obs1' });

    useSimulatorStore.getState().deselectEditObject();
    expect(useSimulatorStore.getState().selectedEditObject).toBeNull();
  });

  it('addObstacle increases obstacle count by one', () => {
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().addObstacle();
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before + 1);
  });

  it('addObstacle selects the new obstacle', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().addObstacle();
    const sel = useSimulatorStore.getState().selectedEditObject;
    expect(sel?.type).toBe('obstacle');
    const ids = useSimulatorStore.getState().arena.obstacles.map((o) => o.id);
    expect(ids).toContain(sel?.id);
  });

  it('deleteSelectedObstacle removes the selected obstacle', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().deleteSelectedObstacle();
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before - 1);
    expect(useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')).toBeUndefined();
  });

  it('deleteSelectedObstacle clears selectedEditObject afterward', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    useSimulatorStore.getState().deleteSelectedObstacle();
    expect(useSimulatorStore.getState().selectedEditObject).toBeNull();
  });

  it('deleteSelectedObstacle does nothing when a target is selected', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('target', 'target1');
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().deleteSelectedObstacle();
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before);
  });

  it('moveSelectedObject moves an obstacle position', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    const beforePos = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.position[2];
    useSimulatorStore.getState().moveSelectedObject('north');
    const afterPos = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.position[2];
    expect(afterPos).toBeCloseTo(beforePos - 0.5, 5);
  });

  it('moveSelectedObject clamps position to arena bounds', () => {
    useSimulatorStore.getState().setEditMode(true);
    // Move way out of bounds many times
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    for (let i = 0; i < 30; i++) {
      useSimulatorStore.getState().moveSelectedObject('north');
    }
    const pos = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.position;
    const arenaSize = useSimulatorStore.getState().arena.size;
    const limit = arenaSize / 2 - 0.6;
    expect(Math.abs(pos[2])).toBeLessThanOrEqual(limit + 0.001);
  });

  it('rotateSelectedObject rotates the selected obstacle by 45°', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    const before = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.rotation ?? 0;
    useSimulatorStore.getState().rotateSelectedObject('cw');
    const after = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.rotation ?? 0;
    expect(after).toBeCloseTo(before + Math.PI / 4, 5);
  });

  it('rotateSelectedObject CCW decrements rotation', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    const before = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.rotation ?? 0;
    useSimulatorStore.getState().rotateSelectedObject('ccw');
    const after = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === 'obs1')!.rotation ?? 0;
    expect(after).toBeCloseTo(before - Math.PI / 4, 5);
  });

  it('rotateSelectedObject does nothing when no obstacle is selected', () => {
    useSimulatorStore.getState().setEditMode(true);
    const obsBefore = useSimulatorStore.getState().arena.obstacles.map((o) => ({ ...o }));
    useSimulatorStore.getState().rotateSelectedObject('cw');
    const obsAfter = useSimulatorStore.getState().arena.obstacles;
    expect(obsAfter).toHaveLength(obsBefore.length);
    obsBefore.forEach((o, i) => {
      expect(obsAfter[i].rotation ?? 0).toBeCloseTo(o.rotation ?? 0, 5);
    });
  });

  it('duplicateSelectedObstacle adds a copy of the selected obstacle', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().duplicateSelectedObstacle();
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before + 1);
  });

  it('duplicateSelectedObstacle preserves modelId, glbUrl, and rotation on the copy', () => {
    useSimulatorStore.getState().setEditMode(true);
    // Place a model-library object so it has modelId + glbUrl
    useSimulatorStore.getState().placeModelFromLibrary('ml-glb-crate');
    const placed = useSimulatorStore.getState().arena.obstacles.at(-1)!;
    // Give it a rotation
    useSimulatorStore.getState().selectEditObject('obstacle', placed.id);
    useSimulatorStore.getState().rotateSelectedObject('cw');
    const rotated = useSimulatorStore.getState().arena.obstacles.find((o) => o.id === placed.id)!;
    // Duplicate
    useSimulatorStore.getState().duplicateSelectedObstacle();
    const dup = useSimulatorStore.getState().arena.obstacles.at(-1)!;
    expect(dup.id).not.toBe(rotated.id);
    expect(dup.modelId).toBe(rotated.modelId);
    expect(dup.glbUrl).toBe(rotated.glbUrl);
    expect(dup.rotation).toBeCloseTo(rotated.rotation ?? 0, 5);
  });

  it('duplicateSelectedObstacle selects the new copy', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectEditObject('obstacle', 'obs1');
    useSimulatorStore.getState().duplicateSelectedObstacle();
    const sel = useSimulatorStore.getState().selectedEditObject;
    expect(sel?.type).toBe('obstacle');
    const ids = useSimulatorStore.getState().arena.obstacles.map((o) => o.id);
    expect(ids).toContain(sel?.id);
    // The copy is not 'obs1'
    expect(sel?.id).not.toBe('obs1');
  });

  it('duplicateSelectedObstacle does nothing when no obstacle is selected', () => {
    useSimulatorStore.getState().setEditMode(true);
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().duplicateSelectedObstacle();
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before);
  });

  it('resetArenaToDefault restores the scenario arena and exits edit mode', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().addObstacle();
    const countBefore = useSimulatorStore.getState().arena.obstacles.length;
    expect(countBefore).toBeGreaterThan(2); // added one extra

    useSimulatorStore.getState().resetArenaToDefault();
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(2); // back to default
    expect(useSimulatorStore.getState().isEditMode).toBe(false);
    expect(useSimulatorStore.getState().selectedEditObject).toBeNull();
  });

  it('loadScenario resets edit mode and snapshots the default arena', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().loadScenario('example-straight-line');
    expect(useSimulatorStore.getState().isEditMode).toBe(false);
    expect(useSimulatorStore.getState().defaultArenaSnapshot).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Route smoke tests: verify page modules export a default component
// ---------------------------------------------------------------------------
describe('route modules export a default component', () => {
  it('home page (/) exports a default function', async () => {
    const mod = await import('@/app/page');
    expect(typeof mod.default).toBe('function');
  });

  it('lessons page (/lessons) exports a default function', async () => {
    const mod = await import('@/app/lessons/page');
    expect(typeof mod.default).toBe('function');
  });

  it('simulator page (/simulator) exports a default function', async () => {
    // The simulator page uses dynamic import for Arena3D.
    // We only verify the module exports a function, not that it renders.
    jest.mock('next/dynamic', () => () => () => null);
    const mod = await import('@/app/simulator/page');
    expect(typeof mod.default).toBe('function');
  });
});

// ---------------------------------------------------------------------------
// Teacher / Demo Mode
// ---------------------------------------------------------------------------
describe('demoMode', () => {
  beforeEach(() => {
    localStorage.removeItem(PERSIST_KEY_DEMO_MODE);
    useSimulatorStore.setState({ demoMode: false });
  });

  it('defaults to false', () => {
    expect(useSimulatorStore.getState().demoMode).toBe(false);
  });

  it('toggleDemoMode flips demoMode to true then back to false', () => {
    useSimulatorStore.getState().toggleDemoMode();
    expect(useSimulatorStore.getState().demoMode).toBe(true);

    useSimulatorStore.getState().toggleDemoMode();
    expect(useSimulatorStore.getState().demoMode).toBe(false);
  });

  it('toggleDemoMode persists the new value to localStorage', () => {
    useSimulatorStore.getState().toggleDemoMode();
    expect(localStorage.getItem(PERSIST_KEY_DEMO_MODE)).toBe('true');

    useSimulatorStore.getState().toggleDemoMode();
    expect(localStorage.getItem(PERSIST_KEY_DEMO_MODE)).toBe('false');
  });

  it('hydrateFromStorage restores demoMode true from localStorage', () => {
    localStorage.setItem(PERSIST_KEY_DEMO_MODE, 'true');
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().demoMode).toBe(true);
  });

  it('hydrateFromStorage does not enable demoMode when key is absent', () => {
    useSimulatorStore.getState().hydrateFromStorage();
    expect(useSimulatorStore.getState().demoMode).toBe(false);
  });

  it('does not affect lesson or scenario state when toggled', () => {
    useSimulatorStore.getState().loadScenario('default-arena');
    useSimulatorStore.getState().toggleDemoMode();
    expect(useSimulatorStore.getState().activeScenarioId).toBe('default-arena');
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });
});
