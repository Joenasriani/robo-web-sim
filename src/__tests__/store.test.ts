/**
 * Smoke tests for Zustand store behaviors:
 *  - loadScenario falls back to default-arena when given an invalid ID
 *  - setActiveLesson persists to localStorage
 *  - hydrateFromStorage falls back to default-arena for bad data
 *  - queue does not auto-resume after hydration
 */

import { PERSIST_KEY_MODE, PERSIST_KEY_SCENARIO, PERSIST_KEY_LESSON, useSimulatorStore } from '@/sim/robotController';

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
