/**
 * Tests for the authored-lesson system:
 *  - isValidAuthoredLesson validates structure
 *  - saveAuthoredLesson persists to localStorage
 *  - loadAuthoredLesson sets the active lesson
 *  - renameAuthoredLesson updates the title
 *  - deleteAuthoredLesson removes the lesson and clears active if needed
 *  - hydrateFromStorage restores an authored lesson from localStorage
 *  - completion rules work for authored lessons
 */

import {
  useSimulatorStore,
  PERSIST_KEY_AUTHORED_LESSONS,
} from '@/sim/robotController';
import {
  isValidAuthoredLesson,
  loadAuthoredLessonsFromStorage,
  PERSIST_KEY_AUTHORED_LESSONS as STORE_KEY,
} from '@/sim/authoredLessons';
import { DEFAULT_ARENA } from '@/sim/arenaConfig';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clearAuthoredStorage() {
  localStorage.removeItem(PERSIST_KEY_AUTHORED_LESSONS);
}

const VALID_AUTHORED: Record<string, unknown> = {
  id:               'authored-1234567890-abc',
  title:            'My Custom Lesson',
  objective:        'Navigate to the target.',
  hint:             'Move forward then turn right.',
  successCondition: 'Reach the target.',
  steps:            [{ instruction: 'Move forward.' }],
  createdAt:        1700000000000,
  completionRules:  { reachTarget: true },
};

beforeEach(() => {
  clearAuthoredStorage();
  useSimulatorStore.setState({
    activeLesson: null,
    activeScenarioId: 'default-arena',
    arena: DEFAULT_ARENA,
    isHydrated: false,
    commandQueue: [],
    simState: 'idle',
    lessonStatus: 'not_started',
    authoredLessons: [],
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
// isValidAuthoredLesson
// ---------------------------------------------------------------------------
describe('isValidAuthoredLesson', () => {
  it('returns true for a well-formed authored lesson', () => {
    expect(isValidAuthoredLesson(VALID_AUTHORED)).toBe(true);
  });

  it('returns false when id does not start with "authored-"', () => {
    expect(isValidAuthoredLesson({ ...VALID_AUTHORED, id: 'lesson-1' })).toBe(false);
  });

  it('returns false for missing id', () => {
    const { id: _id, ...rest } = VALID_AUTHORED;
    expect(isValidAuthoredLesson(rest)).toBe(false);
  });

  it('returns false for empty title', () => {
    expect(isValidAuthoredLesson({ ...VALID_AUTHORED, title: '' })).toBe(false);
    expect(isValidAuthoredLesson({ ...VALID_AUTHORED, title: '   ' })).toBe(false);
  });

  it('returns false for non-array steps', () => {
    expect(isValidAuthoredLesson({ ...VALID_AUTHORED, steps: 'not an array' })).toBe(false);
  });

  it('returns false for steps with bad instruction field', () => {
    expect(isValidAuthoredLesson({ ...VALID_AUTHORED, steps: [{ instruction: 42 }] })).toBe(false);
  });

  it('returns false for missing createdAt', () => {
    const { createdAt: _c, ...rest } = VALID_AUTHORED;
    expect(isValidAuthoredLesson(rest)).toBe(false);
  });

  it('returns false for invalid startPose', () => {
    expect(isValidAuthoredLesson({
      ...VALID_AUTHORED,
      startPose: { position: { x: 'bad', y: 0, z: 0 }, rotation: 0 },
    })).toBe(false);
  });

  it('returns false for invalid arenaOverrides obstacles', () => {
    expect(isValidAuthoredLesson({
      ...VALID_AUTHORED,
      arenaOverrides: { obstacles: 'not-array' },
    })).toBe(false);
  });

  it('returns false for obstacle with missing position', () => {
    expect(isValidAuthoredLesson({
      ...VALID_AUTHORED,
      arenaOverrides: {
        obstacles: [{ id: 'obs1', position: [0], size: [1, 1, 1], color: '#fff' }],
      },
    })).toBe(false);
  });

  it('returns false for invalid completionRules (non-boolean value)', () => {
    expect(isValidAuthoredLesson({
      ...VALID_AUTHORED,
      completionRules: { reachTarget: 'yes' },
    })).toBe(false);
  });

  it('accepts lesson without optional fields', () => {
    const minimal = {
      id:               'authored-minimal',
      title:            'Minimal',
      objective:        '',
      hint:             '',
      successCondition: '',
      steps:            [],
      createdAt:        1000,
    };
    expect(isValidAuthoredLesson(minimal)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidAuthoredLesson(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isValidAuthoredLesson('string')).toBe(false);
    expect(isValidAuthoredLesson(42)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// loadAuthoredLessonsFromStorage
// ---------------------------------------------------------------------------
describe('loadAuthoredLessonsFromStorage', () => {
  it('returns [] when key is missing', () => {
    expect(loadAuthoredLessonsFromStorage()).toEqual([]);
  });

  it('returns [] for invalid JSON', () => {
    localStorage.setItem(STORE_KEY, '{invalid json}');
    expect(loadAuthoredLessonsFromStorage()).toEqual([]);
  });

  it('returns [] for non-array JSON', () => {
    localStorage.setItem(STORE_KEY, '{}');
    expect(loadAuthoredLessonsFromStorage()).toEqual([]);
  });

  it('filters out invalid entries', () => {
    localStorage.setItem(STORE_KEY, JSON.stringify([VALID_AUTHORED, { invalid: true }]));
    expect(loadAuthoredLessonsFromStorage()).toHaveLength(1);
  });

  it('loads a valid authored lesson', () => {
    localStorage.setItem(STORE_KEY, JSON.stringify([VALID_AUTHORED]));
    const lessons = loadAuthoredLessonsFromStorage();
    expect(lessons).toHaveLength(1);
    expect(lessons[0].title).toBe('My Custom Lesson');
  });
});

// ---------------------------------------------------------------------------
// Store: saveAuthoredLesson
// ---------------------------------------------------------------------------
describe('saveAuthoredLesson', () => {
  it('adds a new authored lesson with generated id and createdAt', () => {
    const { saveAuthoredLesson } = useSimulatorStore.getState();
    saveAuthoredLesson({
      title:            'Test Lesson',
      objective:        'Do the thing.',
      hint:             'Press forward.',
      successCondition: 'Reach the target.',
      steps:            [{ instruction: 'Move forward.' }],
      completionRules:  { reachTarget: true },
    });
    const { authoredLessons } = useSimulatorStore.getState();
    expect(authoredLessons).toHaveLength(1);
    expect(authoredLessons[0].title).toBe('Test Lesson');
    expect(authoredLessons[0].id).toMatch(/^authored-/);
    expect(typeof authoredLessons[0].createdAt).toBe('number');
  });

  it('persists to localStorage', () => {
    const { saveAuthoredLesson } = useSimulatorStore.getState();
    saveAuthoredLesson({
      title:            'Persisted Lesson',
      objective:        '',
      hint:             '',
      successCondition: '',
      steps:            [],
      completionRules:  { reachTarget: true },
    });
    const stored = loadAuthoredLessonsFromStorage();
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Persisted Lesson');
  });

  it('prepends new lessons (newest first)', () => {
    const { saveAuthoredLesson } = useSimulatorStore.getState();
    saveAuthoredLesson({ title: 'First', objective: '', hint: '', successCondition: '', steps: [] });
    saveAuthoredLesson({ title: 'Second', objective: '', hint: '', successCondition: '', steps: [] });
    const { authoredLessons } = useSimulatorStore.getState();
    expect(authoredLessons[0].title).toBe('Second');
    expect(authoredLessons[1].title).toBe('First');
  });
});

// ---------------------------------------------------------------------------
// Store: loadAuthoredLesson
// ---------------------------------------------------------------------------
describe('loadAuthoredLesson', () => {
  function saveLesson(title = 'Test') {
    useSimulatorStore.getState().saveAuthoredLesson({
      title,
      objective:        'Test objective.',
      hint:             'Test hint.',
      successCondition: 'Reach the target.',
      steps:            [{ instruction: 'Move forward.' }],
      completionRules:  { reachTarget: true },
    });
  }

  it('sets the loaded lesson as active', () => {
    saveLesson();
    const id = useSimulatorStore.getState().authoredLessons[0].id;
    useSimulatorStore.getState().loadAuthoredLesson(id);
    expect(useSimulatorStore.getState().activeLesson).toBe(id);
  });

  it('does not crash for unknown id', () => {
    expect(() => {
      useSimulatorStore.getState().loadAuthoredLesson('authored-does-not-exist');
    }).not.toThrow();
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Store: renameAuthoredLesson
// ---------------------------------------------------------------------------
describe('renameAuthoredLesson', () => {
  it('renames the lesson with the given id', () => {
    useSimulatorStore.getState().saveAuthoredLesson({
      title: 'Old Title', objective: '', hint: '', successCondition: '', steps: [],
    });
    const id = useSimulatorStore.getState().authoredLessons[0].id;
    useSimulatorStore.getState().renameAuthoredLesson(id, 'New Title');
    expect(useSimulatorStore.getState().authoredLessons[0].title).toBe('New Title');
  });

  it('ignores rename to empty string', () => {
    useSimulatorStore.getState().saveAuthoredLesson({
      title: 'Original', objective: '', hint: '', successCondition: '', steps: [],
    });
    const id = useSimulatorStore.getState().authoredLessons[0].id;
    useSimulatorStore.getState().renameAuthoredLesson(id, '   ');
    expect(useSimulatorStore.getState().authoredLessons[0].title).toBe('Original');
  });
});

// ---------------------------------------------------------------------------
// Store: deleteAuthoredLesson
// ---------------------------------------------------------------------------
describe('deleteAuthoredLesson', () => {
  it('removes the lesson from the list', () => {
    useSimulatorStore.getState().saveAuthoredLesson({
      title: 'To Delete', objective: '', hint: '', successCondition: '', steps: [],
    });
    const id = useSimulatorStore.getState().authoredLessons[0].id;
    useSimulatorStore.getState().deleteAuthoredLesson(id);
    expect(useSimulatorStore.getState().authoredLessons).toHaveLength(0);
  });

  it('clears activeLesson if the active lesson is deleted', () => {
    useSimulatorStore.getState().saveAuthoredLesson({
      title: 'Active Lesson', objective: '', hint: '', successCondition: '', steps: [],
      completionRules: { reachTarget: true },
    });
    const id = useSimulatorStore.getState().authoredLessons[0].id;
    useSimulatorStore.getState().loadAuthoredLesson(id);
    expect(useSimulatorStore.getState().activeLesson).toBe(id);
    useSimulatorStore.getState().deleteAuthoredLesson(id);
    expect(useSimulatorStore.getState().activeLesson).toBeNull();
    expect(useSimulatorStore.getState().lessonStatus).toBe('not_started');
  });

  it('persists deletion to localStorage', () => {
    useSimulatorStore.getState().saveAuthoredLesson({
      title: 'Deletable', objective: '', hint: '', successCondition: '', steps: [],
    });
    const id = useSimulatorStore.getState().authoredLessons[0].id;
    useSimulatorStore.getState().deleteAuthoredLesson(id);
    expect(loadAuthoredLessonsFromStorage()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// hydrateFromStorage with authored lesson
// ---------------------------------------------------------------------------
describe('hydrateFromStorage with authored lesson', () => {
  it('restores an authored lesson as active on hydration', () => {
    // Save an authored lesson first
    useSimulatorStore.getState().saveAuthoredLesson({
      title:            'Hydrated Lesson',
      objective:        '',
      hint:             '',
      successCondition: '',
      steps:            [],
      completionRules:  { reachTarget: true },
    });
    const id = useSimulatorStore.getState().authoredLessons[0].id;

    // Simulate persistence keys
    localStorage.setItem('robo-web-sim-mode', 'lesson');
    localStorage.setItem('robo-web-sim-active-lesson', id);

    useSimulatorStore.setState({ activeLesson: null, isHydrated: false });
    useSimulatorStore.getState().hydrateFromStorage();

    expect(useSimulatorStore.getState().activeLesson).toBe(id);
    expect(useSimulatorStore.getState().isHydrated).toBe(true);
  });
});
