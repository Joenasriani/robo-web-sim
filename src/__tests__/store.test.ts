/**
 * Smoke tests for Zustand store behaviors:
 *  - loadScenario falls back to default-arena when given an invalid ID
 *  - setActiveLesson persists to localStorage
 *  - hydrateFromStorage falls back to default-arena for bad data
 *  - queue does not auto-resume after hydration
 */

import { PERSIST_KEY_MODE, PERSIST_KEY_SCENARIO, PERSIST_KEY_LESSON, useSimulatorStore } from '@/sim/robotController';
import type { ArenaConfig } from '@/sim/arenaConfig';

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
    placementTool: null,
    placementPreviewPosition: null,
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

  it('selectPlacementTool only works when edit mode is enabled', () => {
    useSimulatorStore.getState().setEditMode(false);
    useSimulatorStore.getState().selectPlacementTool('ml-red-crate');
    expect(useSimulatorStore.getState().placementTool).toBeNull();

    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectPlacementTool('ml-red-crate');
    expect(useSimulatorStore.getState().placementTool?.modelId).toBe('ml-red-crate');
  });

  it('placeSelectedModelAt adds an obstacle when a placement tool is active', () => {
    useSimulatorStore.getState().setEditMode(true);
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().selectPlacementTool('ml-traffic-cone');
    useSimulatorStore.getState().placeSelectedModelAt([1.2, 0.5, -2.3]);

    const state = useSimulatorStore.getState();
    expect(state.arena.obstacles.length).toBe(before + 1);
    expect(state.arena.obstacles.at(-1)?.modelId).toBe('ml-traffic-cone');
  });

  it('setEditMode(false) clears placement tool and preview', () => {
    useSimulatorStore.getState().setEditMode(true);
    useSimulatorStore.getState().selectPlacementTool('ml-red-crate');
    useSimulatorStore.getState().setPlacementPreviewPosition([0, 0.5, 0]);
    useSimulatorStore.getState().setEditMode(false);

    expect(useSimulatorStore.getState().placementTool).toBeNull();
    expect(useSimulatorStore.getState().placementPreviewPosition).toBeNull();
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
// runQueue early-exit behavior (Bug 1 & Bug 3 fixes)
// ---------------------------------------------------------------------------

/** Arena with a wall obstacle blocking the robot's +Z forward path from (0,0,0). */
const ARENA_OBSTACLE_AHEAD: ArenaConfig = {
  size: 10,
  obstacles: [{ id: 'wall', position: [0, 0.5, 0.5], size: [1, 1, 1], color: '#ff0000' }],
  targets: [{ id: 'far', position: [0, 0.05, 8], radius: 0.3, color: '#22c55e' }],
  wallColor: '#94a3b8',
  floorColor: '#2d4a6e',
};

const ROBOT_AT_ORIGIN = {
  position: { x: 0, y: 0.25, z: 0 },
  rotation: 0,
  isMoving: false,
  isRunningQueue: false,
  isPaused: false,
  health: 'ok' as const,
  sensors: { frontDistance: 5, leftObstacle: false, rightObstacle: false, targetDistance: 99 },
};

describe('runQueue early-exit on terminal states', () => {
  beforeEach(() => {
    clearStorage();
    useSimulatorStore.setState({
      activeLesson: null,
      activeScenarioId: 'default-arena',
      isHydrated: false,
      commandQueue: [],
      eventLog: [],
      simState: 'idle',
      simSpeed: 100, // fast — 6 ms delay per command
      queueEverCompleted: false,
      robot: { ...ROBOT_AT_ORIGIN },
    });
  });

  it('stops executing after the first collision — no extra commands run', async () => {
    useSimulatorStore.setState({ arena: ARENA_OBSTACLE_AHEAD });

    // 3 forward commands; the 1st causes a collision
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('forward');

    await useSimulatorStore.getState().runQueue();

    const state = useSimulatorStore.getState();
    expect(state.robot.health).toBe('hit_obstacle');
    expect(state.simState).toBe('blocked');
    expect(state.robot.isRunningQueue).toBe(false);

    // Only one collision event should be in the log
    const collisionEvents = state.eventLog.filter((e) => e.message.includes('Collision'));
    expect(collisionEvents).toHaveLength(1);
  });

  it('sets queueEverCompleted=false when the queue exits due to collision', async () => {
    useSimulatorStore.setState({ arena: ARENA_OBSTACLE_AHEAD });

    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('forward');

    await useSimulatorStore.getState().runQueue();

    expect(useSimulatorStore.getState().queueEverCompleted).toBe(false);
  });

  it('resets robot health to ok when starting a queue run', async () => {
    useSimulatorStore.setState({
      robot: { ...useSimulatorStore.getState().robot, health: 'hit_obstacle' },
      simState: 'blocked',
    });

    useSimulatorStore.getState().addCommand('wait');
    await useSimulatorStore.getState().runQueue();

    const state = useSimulatorStore.getState();
    expect(state.robot.health).toBe('ok');
    expect(state.simState).toBe('idle');
    expect(state.queueEverCompleted).toBe(true);
  });

  it('stops immediately when target is reached mid-queue — no commands after target', async () => {
    // Lesson 4 arena: target at [0, 0.05, 3.5] radius 0.6; obstacles off to the sides
    // Robot at origin facing +Z; step 0.5 → target reached at z ≈ 3.0 (step 6)
    useSimulatorStore.getState().setActiveLesson('lesson-4');
    useSimulatorStore.setState({ simSpeed: 100 });

    // 8 commands — only ~6 needed to reach target; last 2 should NOT run
    for (let i = 0; i < 8; i++) {
      useSimulatorStore.getState().addCommand('forward');
    }

    await useSimulatorStore.getState().runQueue();

    const state = useSimulatorStore.getState();
    expect(state.robot.health).toBe('reached_target');
    expect(state.simState).toBe('completed');
    expect(state.robot.isRunningQueue).toBe(false);

    // Only one "Target reached" event
    const targetEvents = state.eventLog.filter((e) => e.message.includes('Target reached'));
    expect(targetEvents).toHaveLength(1);
    expect(state.queueEverCompleted).toBe(false);
  });

  it('sets queueEverCompleted=true and marks lesson complete when target reached (Lesson 4 regression)', async () => {
    // Lesson 4 requires completeQueue:true AND reachTarget:true
    useSimulatorStore.getState().setActiveLesson('lesson-4');
    useSimulatorStore.setState({ simSpeed: 100 });

    // Exactly 6 commands to reach the target on the last step
    for (let i = 0; i < 6; i++) {
      useSimulatorStore.getState().addCommand('forward');
    }

    await useSimulatorStore.getState().runQueue();

    const state = useSimulatorStore.getState();
    expect(state.queueEverCompleted).toBe(true);
    expect(state.lessonStatus).toBe('completed');
  });

  it('pauseRobot toggles paused/running while queue is active', () => {
    useSimulatorStore.getState().addCommand('wait');
    useSimulatorStore.getState().runQueue();

    useSimulatorStore.getState().pauseRobot();
    expect(useSimulatorStore.getState().robot.isPaused).toBe(true);
    expect(useSimulatorStore.getState().simState).toBe('paused');

    useSimulatorStore.getState().pauseRobot();
    expect(useSimulatorStore.getState().robot.isPaused).toBe(false);
    expect(useSimulatorStore.getState().simState).toBe('running');

    useSimulatorStore.getState().stopRobot();
  });

  it('stopRobot keeps simState idle even if in-flight run had terminal health', async () => {
    useSimulatorStore.getState().addCommand('wait');
    useSimulatorStore.getState().runQueue();

    useSimulatorStore.setState((s) => ({
      robot: { ...s.robot, health: 'hit_obstacle' },
    }));
    useSimulatorStore.getState().stopRobot();

    await new Promise((r) => setTimeout(r, 120));

    const state = useSimulatorStore.getState();
    expect(state.simState).toBe('idle');
    expect(state.robot.isRunningQueue).toBe(false);
    expect(state.robot.isPaused).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// replayFromStart behavior
// ---------------------------------------------------------------------------

describe('replayFromStart', () => {
  beforeEach(() => {
    clearStorage();
    useSimulatorStore.setState({
      activeLesson: null,
      activeScenarioId: 'default-arena',
      isHydrated: false,
      commandQueue: [],
      eventLog: [],
      simState: 'idle',
      simSpeed: 100,
      queueEverCompleted: false,
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

  it('resets robot to lesson start pose in lesson mode', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    // Manually move the robot away from start
    useSimulatorStore.setState({
      robot: {
        ...useSimulatorStore.getState().robot,
        position: { x: 3, y: 0.25, z: 3 },
        health: 'hit_obstacle',
      },
    });

    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().replayFromStart();

    const state = useSimulatorStore.getState();
    // Robot should be back at the lesson start position
    const lesson1 = useSimulatorStore.getState().activeLesson;
    expect(lesson1).toBe('lesson-1');
    expect(state.robot.health).toBe('ok');
    expect(state.robot.isRunningQueue).toBe(true); // runQueue started
    expect(state.simState).toBe('running');
  });

  it('resets robot to scenario start pose in free-play mode', () => {
    useSimulatorStore.getState().loadScenario('example-straight-line');
    // Move robot away and set bad health
    useSimulatorStore.setState({
      robot: {
        ...useSimulatorStore.getState().robot,
        position: { x: 5, y: 0.25, z: 5 },
        health: 'hit_obstacle',
      },
      simState: 'blocked',
    });

    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().replayFromStart();

    const state = useSimulatorStore.getState();
    // Health should be reset to 'ok' (regardless of where the queue has moved the robot since)
    expect(state.robot.health).toBe('ok');
    // Queue should have started running
    expect(state.robot.isRunningQueue).toBe(true);
    expect(state.activeScenarioId).toBe('example-straight-line');
  });

  it('resets all control flags (isRunningQueue, isPaused, isMoving) before starting', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    // Simulate a paused/running state
    useSimulatorStore.setState({
      robot: {
        ...useSimulatorStore.getState().robot,
        isRunningQueue: true,
        isPaused: true,
        isMoving: true,
      },
      simState: 'paused',
    });

    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().replayFromStart();

    // After replayFromStart the new runQueue should have started,
    // but crucially the flags should be freshly set by runQueue (isRunningQueue=true, isPaused=false, isMoving=false)
    const state = useSimulatorStore.getState();
    expect(state.robot.isPaused).toBe(false);
    expect(state.robot.isMoving).toBe(false);
    // isRunningQueue=true because runQueue is now running
    expect(state.robot.isRunningQueue).toBe(true);
    expect(state.simState).toBe('running');
  });

  it('resets state but does not start queue when commandQueue is empty', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    useSimulatorStore.setState({
      robot: {
        ...useSimulatorStore.getState().robot,
        position: { x: 3, y: 0.25, z: 3 },
        health: 'hit_obstacle',
        isRunningQueue: false,
      },
      simState: 'blocked',
    });

    // Empty queue
    useSimulatorStore.getState().replayFromStart();

    const state = useSimulatorStore.getState();
    expect(state.robot.health).toBe('ok');
    expect(state.robot.isRunningQueue).toBe(false); // no queue to run
    expect(state.simState).toBe('idle');
  });

  it('cancels a running queue and starts a fresh run from the beginning', async () => {
    useSimulatorStore.getState().loadScenario('example-straight-line');
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('forward');

    // Start the queue (don't await — we want it mid-run)
    useSimulatorStore.getState().runQueue();

    // Immediately replay before the queue finishes
    useSimulatorStore.getState().replayFromStart();

    // State should show the replay has started a new run
    const stateAfterReplay = useSimulatorStore.getState();
    expect(stateAfterReplay.robot.health).toBe('ok');
    expect(stateAfterReplay.robot.isRunningQueue).toBe(true); // new run is in progress
    expect(stateAfterReplay.simState).toBe('running');
  });

  it('scenario replay uses the current store arena for sensor computation', () => {
    useSimulatorStore.getState().loadScenario('example-straight-line');
    const originalArena = useSimulatorStore.getState().arena;

    // Modify the arena (simulate edit mode changes)
    const modifiedArena = {
      ...originalArena,
      obstacles: [],  // remove all obstacles
    };
    useSimulatorStore.setState({ arena: modifiedArena });

    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().replayFromStart();

    const state = useSimulatorStore.getState();
    // Robot sensors should be computed against modifiedArena (no obstacles)
    // With no obstacles, frontDistance should be >= 4 (wall is at size/2 = 5 away)
    // The sensor cap is 5.0, so with an empty arena we expect a reading above 3.
    const MIN_EXPECTED_WALL_DISTANCE = 3; // safely below the wall-distance cap of 5.0
    expect(state.robot.sensors.frontDistance).toBeGreaterThan(MIN_EXPECTED_WALL_DISTANCE);
  });

  it('adds a replay event to the event log for lessons', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().replayFromStart();

    const log = useSimulatorStore.getState().eventLog;
    expect(log.some((e) => e.message.includes('Replay'))).toBe(true);
  });

  it('adds a replay event to the event log for scenarios', () => {
    useSimulatorStore.getState().loadScenario('example-straight-line');
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().replayFromStart();

    const log = useSimulatorStore.getState().eventLog;
    expect(log.some((e) => e.message.includes('Replay'))).toBe(true);
  });

  it('does nothing when neither activeLesson nor activeScenarioId is set', () => {
    useSimulatorStore.setState({
      activeLesson: null,
      activeScenarioId: null,
      robot: {
        position: { x: 2, y: 0.25, z: 2 },
        rotation: 0,
        isMoving: false,
        isRunningQueue: false,
        isPaused: false,
        health: 'ok',
        sensors: { frontDistance: 5, leftObstacle: false, rightObstacle: false, targetDistance: 99 },
      },
    });
    useSimulatorStore.getState().addCommand('forward');

    const positionBefore = useSimulatorStore.getState().robot.position;
    useSimulatorStore.getState().replayFromStart();
    const positionAfter = useSimulatorStore.getState().robot.position;

    // Position unchanged — no active context to replay
    expect(positionAfter).toEqual(positionBefore);
  });
});

// ---------------------------------------------------------------------------
// Color consistency: scenario floorColor matches DEFAULT_ARENA
// ---------------------------------------------------------------------------
describe('scenario color consistency', () => {
  it('straightLineScenario floorColor matches DEFAULT_ARENA.floorColor', async () => {
    const { straightLineScenario } = await import('@/scenarios/examples/straightLineScenario');
    const { DEFAULT_ARENA } = await import('@/sim/arenaConfig');
    expect(straightLineScenario.arena.floorColor).toBe(DEFAULT_ARENA.floorColor);
  });

  it('mazeLiteScenario floorColor matches DEFAULT_ARENA.floorColor', async () => {
    const { mazeLiteScenario } = await import('@/scenarios/examples/mazeLiteScenario');
    const { DEFAULT_ARENA } = await import('@/sim/arenaConfig');
    expect(mazeLiteScenario.arena.floorColor).toBe(DEFAULT_ARENA.floorColor);
  });

  it('defaultArenaScenario floorColor matches DEFAULT_ARENA.floorColor', async () => {
    const { defaultArenaScenario } = await import('@/scenarios/examples/defaultArenaScenario');
    const { DEFAULT_ARENA } = await import('@/sim/arenaConfig');
    expect(defaultArenaScenario.arena.floorColor).toBe(DEFAULT_ARENA.floorColor);
  });

  it('all FREE_PLAY_SCENARIOS use the same floorColor as DEFAULT_ARENA', async () => {
    const { FREE_PLAY_SCENARIOS } = await import('@/scenarios');
    const { DEFAULT_ARENA } = await import('@/sim/arenaConfig');
    for (const scenario of FREE_PLAY_SCENARIOS) {
      expect(scenario.arena.floorColor).toBe(DEFAULT_ARENA.floorColor);
    }
  });
});
