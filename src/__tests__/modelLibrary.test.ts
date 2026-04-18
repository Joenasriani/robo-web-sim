/**
 * Model Library tests:
 *  - Model definitions are valid and complete
 *  - placeModelFromLibrary adds an obstacle to the free-play arena
 *  - placeModelFromLibrary is a no-op in lesson mode
 *  - placeModelFromLibrary with an unknown id logs a warning but does not crash
 *  - Metadata (source, creator, license, category) is present on all models
 */

import { useSimulatorStore } from '@/sim/robotController';
import {
  CURATED_MODELS,
  MODEL_CATEGORIES,
  getModelById,
  getModelsByCategory,
} from '@/models/modelLibrary';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

beforeEach(() => {
  // Reset store to a clean free-play state before each test
  useSimulatorStore.setState({
    activeLesson: null,
    activeScenarioId: 'default-arena',
    isHydrated: false,
    commandQueue: [],
    simState: 'idle',
    isEditMode: false,
    selectedEditObject: null,
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
  // Load default arena so the arena state is fresh
  useSimulatorStore.getState().loadScenario('default-arena');
});

// ---------------------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------------------
describe('CURATED_MODELS definitions', () => {
  it('has at least one model per category', () => {
    const categories = MODEL_CATEGORIES.map((c) => c.id);
    for (const cat of categories) {
      const models = getModelsByCategory(cat);
      expect(models.length).toBeGreaterThan(0);
    }
  });

  it('every model has required metadata fields', () => {
    for (const model of CURATED_MODELS) {
      expect(typeof model.id).toBe('string');
      expect(model.id.length).toBeGreaterThan(0);
      expect(typeof model.name).toBe('string');
      expect(model.name.length).toBeGreaterThan(0);
      expect(typeof model.description).toBe('string');
      expect(typeof model.source).toBe('string');
      expect(typeof model.creator).toBe('string');
      expect(typeof model.license).toBe('string');
      expect(['builtin', 'glb']).toContain(model.renderType);
      expect(typeof model.thumbnail).toBe('string');
    }
  });

  it('every model has valid placementDefaults', () => {
    for (const model of CURATED_MODELS) {
      const { size, color } = model.placementDefaults;
      expect(size).toHaveLength(3);
      size.forEach((dim) => expect(dim).toBeGreaterThan(0));
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  it('all model ids are unique', () => {
    const ids = CURATED_MODELS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('getModelById returns the correct model', () => {
    const model = getModelById('ml-red-crate');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Red Crate');
  });

  it('getModelById returns undefined for unknown id', () => {
    expect(getModelById('does-not-exist')).toBeUndefined();
  });

  it('getModelsByCategory returns only models for that category', () => {
    const obstacles = getModelsByCategory('obstacle');
    obstacles.forEach((m) => expect(m.category).toBe('obstacle'));
  });

  it('glb models have glbUrl and no-undefined thumbnail', () => {
    const glbModels = CURATED_MODELS.filter((m) => m.renderType === 'glb');
    expect(glbModels.length).toBeGreaterThan(0);
    for (const model of glbModels) {
      expect(typeof model.glbUrl).toBe('string');
      expect(model.glbUrl!.length).toBeGreaterThan(0);
      expect(model.glbUrl).toMatch(/^\/models\/.+\.glb$/);
      expect(typeof model.thumbnail).toBe('string');
    }
  });

  it('glb models have previewImage pointing to /model-previews/', () => {
    const glbModels = CURATED_MODELS.filter((m) => m.renderType === 'glb');
    for (const model of glbModels) {
      expect(model.previewImage).toBeDefined();
      expect(model.previewImage).toMatch(/^\/model-previews\//);
    }
  });

  it('builtin models do not have glbUrl', () => {
    const builtinModels = CURATED_MODELS.filter((m) => m.renderType === 'builtin');
    expect(builtinModels.length).toBeGreaterThan(0);
    for (const model of builtinModels) {
      expect(model.glbUrl).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// placeModelFromLibrary — store action
// ---------------------------------------------------------------------------
describe('placeModelFromLibrary', () => {
  it('adds an obstacle to the arena when in free-play mode', () => {
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().placeModelFromLibrary('ml-red-crate');
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before + 1);
  });

  it('placed obstacle uses the model colour and size', () => {
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().placeModelFromLibrary('ml-stone-wall');
    const obstacles = useSimulatorStore.getState().arena.obstacles;
    const placed = obstacles[before]; // newly added
    expect(placed.color).toBe('#94a3b8');
    expect(placed.size).toEqual([2.5, 1, 0.4]);
  });

  it('does NOT place when a lesson is active', () => {
    useSimulatorStore.getState().setActiveLesson('lesson-1');
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().placeModelFromLibrary('ml-red-crate');
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before);
  });

  it('logs a warning and does not crash for an unknown model id', () => {
    const before = useSimulatorStore.getState().arena.obstacles.length;
    const logBefore = useSimulatorStore.getState().eventLog.length;
    useSimulatorStore.getState().placeModelFromLibrary('totally-unknown-model');
    // Obstacle count unchanged
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before);
    // Warning event was appended
    expect(useSimulatorStore.getState().eventLog.length).toBe(logBefore + 1);
    const lastEntry = useSimulatorStore.getState().eventLog.at(-1)!;
    expect(lastEntry.type).toBe('warning');
    expect(lastEntry.message).toContain('totally-unknown-model');
  });

  it('appends a success event log entry on valid placement', () => {
    const logBefore = useSimulatorStore.getState().eventLog.length;
    useSimulatorStore.getState().placeModelFromLibrary('ml-traffic-cone');
    expect(useSimulatorStore.getState().eventLog.length).toBe(logBefore + 1);
    const lastEntry = useSimulatorStore.getState().eventLog.at(-1)!;
    expect(lastEntry.type).toBe('success');
    expect(lastEntry.message).toContain('Traffic Cone');
  });

  it('placed obstacle position is within arena bounds', () => {
    useSimulatorStore.getState().placeModelFromLibrary('ml-blue-barrel');
    const arena = useSimulatorStore.getState().arena;
    const placed = arena.obstacles.at(-1)!;
    const half = arena.size / 2 - 0.6;
    expect(Math.abs(placed.position[0])).toBeLessThanOrEqual(half + 0.001);
    expect(Math.abs(placed.position[2])).toBeLessThanOrEqual(half + 0.001);
  });

  it('places multiple different models without error', () => {
    const ids = CURATED_MODELS.map((m) => m.id);
    const before = useSimulatorStore.getState().arena.obstacles.length;
    for (const id of ids) {
      useSimulatorStore.getState().placeModelFromLibrary(id);
    }
    expect(useSimulatorStore.getState().arena.obstacles.length).toBe(before + ids.length);
  });

  it('placed GLB obstacle carries glbUrl and modelId', () => {
    const glbModel = CURATED_MODELS.find((m) => m.renderType === 'glb')!;
    expect(glbModel).toBeDefined();
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().placeModelFromLibrary(glbModel.id);
    const obstacles = useSimulatorStore.getState().arena.obstacles;
    const placed = obstacles[before];
    expect(placed.glbUrl).toBe(glbModel.glbUrl);
    expect(placed.modelId).toBe(glbModel.id);
  });

  it('placed builtin obstacle does not carry glbUrl', () => {
    const builtinModel = CURATED_MODELS.find((m) => m.renderType === 'builtin')!;
    const before = useSimulatorStore.getState().arena.obstacles.length;
    useSimulatorStore.getState().placeModelFromLibrary(builtinModel.id);
    const obstacles = useSimulatorStore.getState().arena.obstacles;
    const placed = obstacles[before];
    expect(placed.glbUrl).toBeUndefined();
    expect(placed.modelId).toBe(builtinModel.id);
  });
});
