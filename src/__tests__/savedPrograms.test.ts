/**
 * Tests for saved-program store actions and validation:
 *  - isValidSavedProgram validates structure and command types
 *  - saveCurrentProgram persists to localStorage
 *  - loadSavedProgram restores the command queue
 *  - renameSavedProgram updates the name
 *  - deleteSavedProgram removes the program
 *  - importProgram adds a program from external data
 *  - loadSavedProgram fails safely on invalid data
 */

import {
  useSimulatorStore,
  PERSIST_KEY_SAVED_PROGRAMS,
} from '@/sim/robotController';
import { isValidSavedProgram } from '@/sim/savedPrograms';
import { DEFAULT_ARENA } from '@/sim/arenaConfig';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function clearProgramsStorage() {
  localStorage.removeItem(PERSIST_KEY_SAVED_PROGRAMS);
}

beforeEach(() => {
  clearProgramsStorage();
  // Reset store to a clean state between tests
  useSimulatorStore.setState({
    activeLesson: null,
    activeScenarioId: 'default-arena',
    arena: DEFAULT_ARENA,
    isHydrated: false,
    commandQueue: [],
    simState: 'idle',
    savedPrograms: [],
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
// Fixtures
// ---------------------------------------------------------------------------
const validCommands = [
  { id: 'cmd-1', type: 'forward' as const, label: '↑ Forward' },
  { id: 'cmd-2', type: 'left' as const, label: '← Turn Left' },
  { id: 'cmd-3', type: 'wait' as const, label: '⏸ Wait' },
];

const validProgram = {
  id: 'prog-123',
  name: 'Test Program',
  commands: validCommands,
  createdAt: 1700000000000,
  updatedAt: 1700000000000,
};

// ---------------------------------------------------------------------------
// isValidSavedProgram
// ---------------------------------------------------------------------------
describe('isValidSavedProgram', () => {
  it('returns true for a well-formed program', () => {
    expect(isValidSavedProgram(validProgram)).toBe(true);
  });

  it('returns true for an empty commands array', () => {
    expect(isValidSavedProgram({ ...validProgram, commands: [] })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidSavedProgram(null)).toBe(false);
  });

  it('returns false when id is missing', () => {
    const { id: _omit, ...rest } = validProgram;
    expect(isValidSavedProgram(rest)).toBe(false);
  });

  it('returns false when id is empty string', () => {
    expect(isValidSavedProgram({ ...validProgram, id: '' })).toBe(false);
  });

  it('returns false when name is not a string', () => {
    expect(isValidSavedProgram({ ...validProgram, name: 42 })).toBe(false);
  });

  it('returns false when createdAt is not a number', () => {
    expect(isValidSavedProgram({ ...validProgram, createdAt: '2024-01-01' })).toBe(false);
  });

  it('returns false when updatedAt is not a number', () => {
    expect(isValidSavedProgram({ ...validProgram, updatedAt: null })).toBe(false);
  });

  it('returns false when commands is not an array', () => {
    expect(isValidSavedProgram({ ...validProgram, commands: 'bad' })).toBe(false);
  });

  it('returns false when a command has an invalid type', () => {
    const bad = { ...validProgram, commands: [{ id: 'c1', type: 'fly', label: '✈️ Fly' }] };
    expect(isValidSavedProgram(bad)).toBe(false);
  });

  it('returns false when a command is missing id', () => {
    const bad = { ...validProgram, commands: [{ type: 'forward', label: '↑ Forward' }] };
    expect(isValidSavedProgram(bad)).toBe(false);
  });

  it('returns false when a command has an empty id', () => {
    const bad = { ...validProgram, commands: [{ id: '', type: 'forward', label: '↑ Forward' }] };
    expect(isValidSavedProgram(bad)).toBe(false);
  });

  it('returns false when a command label is not a string', () => {
    const bad = { ...validProgram, commands: [{ id: 'c1', type: 'forward', label: 99 }] };
    expect(isValidSavedProgram(bad)).toBe(false);
  });

  it('accepts all valid command types', () => {
    const allTypes = ['forward', 'backward', 'left', 'right', 'wait'];
    const cmds = allTypes.map((type, i) => ({ id: `c${i}`, type, label: type }));
    expect(isValidSavedProgram({ ...validProgram, commands: cmds })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// saveCurrentProgram
// ---------------------------------------------------------------------------
describe('saveCurrentProgram', () => {
  beforeEach(() => {
    // Seed some commands into the queue
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('left');
  });

  it('adds a program to savedPrograms', () => {
    useSimulatorStore.getState().saveCurrentProgram('My Program');
    expect(useSimulatorStore.getState().savedPrograms).toHaveLength(1);
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('My Program');
  });

  it('saves the command queue into the program', () => {
    useSimulatorStore.getState().saveCurrentProgram('Queue Snapshot');
    const program = useSimulatorStore.getState().savedPrograms[0];
    expect(program.commands).toHaveLength(2);
    expect(program.commands[0].type).toBe('forward');
    expect(program.commands[1].type).toBe('left');
  });

  it('persists to localStorage', () => {
    useSimulatorStore.getState().saveCurrentProgram('Persisted Program');
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_PROGRAMS);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Persisted Program');
  });

  it('records createdAt and updatedAt timestamps', () => {
    const before = Date.now();
    useSimulatorStore.getState().saveCurrentProgram('Timestamps');
    const after = Date.now();
    const program = useSimulatorStore.getState().savedPrograms[0];
    expect(program.createdAt).toBeGreaterThanOrEqual(before);
    expect(program.createdAt).toBeLessThanOrEqual(after);
    expect(program.updatedAt).toBe(program.createdAt);
  });

  it('ignores blank names', () => {
    useSimulatorStore.getState().saveCurrentProgram('   ');
    expect(useSimulatorStore.getState().savedPrograms).toHaveLength(0);
  });

  it('trims whitespace from name', () => {
    useSimulatorStore.getState().saveCurrentProgram('  Trimmed  ');
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('Trimmed');
  });

  it('is no-op when queue is empty', () => {
    useSimulatorStore.setState({ commandQueue: [] });
    useSimulatorStore.getState().saveCurrentProgram('Empty Queue');
    expect(useSimulatorStore.getState().savedPrograms).toHaveLength(0);
  });

  it('prepends new programs (newest first)', () => {
    useSimulatorStore.getState().saveCurrentProgram('First');
    useSimulatorStore.getState().saveCurrentProgram('Second');
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('Second');
    expect(useSimulatorStore.getState().savedPrograms[1].name).toBe('First');
  });
});

// ---------------------------------------------------------------------------
// loadSavedProgram
// ---------------------------------------------------------------------------
describe('loadSavedProgram', () => {
  beforeEach(() => {
    // Seed one saved program
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().addCommand('right');
    useSimulatorStore.getState().saveCurrentProgram('Seed Program');
    // Clear queue after saving so we can test load behavior
    useSimulatorStore.getState().clearQueue();
  });

  it('loads the command queue from the saved program', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    useSimulatorStore.getState().loadSavedProgram(id);
    const queue = useSimulatorStore.getState().commandQueue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('forward');
    expect(queue[1].type).toBe('right');
  });

  it('assigns fresh command ids on load', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    const originalIds = useSimulatorStore.getState().savedPrograms[0].commands.map((c) => c.id);
    useSimulatorStore.getState().loadSavedProgram(id);
    const newIds = useSimulatorStore.getState().commandQueue.map((c) => c.id);
    // The loaded queue should have different IDs (freshly created)
    for (const newId of newIds) {
      expect(originalIds).not.toContain(newId);
    }
  });

  it('resets currentCommandIndex and stops any running queue', () => {
    useSimulatorStore.setState({ simState: 'running' });
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    useSimulatorStore.getState().loadSavedProgram(id);
    expect(useSimulatorStore.getState().currentCommandIndex).toBeNull();
    expect(useSimulatorStore.getState().simState).toBe('idle');
  });

  it('does nothing for an unknown id', () => {
    useSimulatorStore.getState().addCommand('backward');
    useSimulatorStore.getState().loadSavedProgram('no-such-id');
    // Queue should be unchanged (the backward command we added)
    expect(useSimulatorStore.getState().commandQueue).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// renameSavedProgram
// ---------------------------------------------------------------------------
describe('renameSavedProgram', () => {
  beforeEach(() => {
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().saveCurrentProgram('Original Name');
    useSimulatorStore.getState().clearQueue();
  });

  it('renames the program', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    useSimulatorStore.getState().renameSavedProgram(id, 'New Name');
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('New Name');
  });

  it('persists the rename to localStorage', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    useSimulatorStore.getState().renameSavedProgram(id, 'Persisted Name');
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_PROGRAMS);
    const parsed = JSON.parse(raw!);
    expect(parsed[0].name).toBe('Persisted Name');
  });

  it('ignores blank names', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    useSimulatorStore.getState().renameSavedProgram(id, '   ');
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('Original Name');
  });

  it('trims whitespace from the new name', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    useSimulatorStore.getState().renameSavedProgram(id, '  Trimmed Name  ');
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('Trimmed Name');
  });

  it('updates updatedAt timestamp', () => {
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    const originalUpdatedAt = useSimulatorStore.getState().savedPrograms[0].updatedAt;
    // Small delay to ensure timestamp differs
    jest.useFakeTimers();
    jest.advanceTimersByTime(1000);
    useSimulatorStore.getState().renameSavedProgram(id, 'New Name');
    jest.useRealTimers();
    expect(useSimulatorStore.getState().savedPrograms[0].updatedAt).toBeGreaterThan(originalUpdatedAt);
  });
});

// ---------------------------------------------------------------------------
// deleteSavedProgram
// ---------------------------------------------------------------------------
describe('deleteSavedProgram', () => {
  beforeEach(() => {
    useSimulatorStore.getState().addCommand('forward');
    useSimulatorStore.getState().saveCurrentProgram('To Delete');
    useSimulatorStore.getState().saveCurrentProgram('To Keep');
    useSimulatorStore.getState().clearQueue();
  });

  it('removes the program', () => {
    const programs = useSimulatorStore.getState().savedPrograms;
    const idToDelete = programs.find((p) => p.name === 'To Delete')!.id;
    useSimulatorStore.getState().deleteSavedProgram(idToDelete);
    const names = useSimulatorStore.getState().savedPrograms.map((p) => p.name);
    expect(names).not.toContain('To Delete');
    expect(names).toContain('To Keep');
  });

  it('persists the deletion to localStorage', () => {
    const programs = useSimulatorStore.getState().savedPrograms;
    const idToDelete = programs.find((p) => p.name === 'To Delete')!.id;
    useSimulatorStore.getState().deleteSavedProgram(idToDelete);
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_PROGRAMS);
    const parsed = JSON.parse(raw!);
    expect(parsed.map((p: { name: string }) => p.name)).not.toContain('To Delete');
  });

  it('does nothing when id does not match', () => {
    useSimulatorStore.getState().deleteSavedProgram('no-such-id');
    expect(useSimulatorStore.getState().savedPrograms).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// importProgram
// ---------------------------------------------------------------------------
describe('importProgram', () => {
  it('adds the program to savedPrograms', () => {
    useSimulatorStore.getState().importProgram(validProgram);
    expect(useSimulatorStore.getState().savedPrograms).toHaveLength(1);
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('Test Program');
  });

  it('assigns a fresh id to the imported program', () => {
    useSimulatorStore.getState().importProgram(validProgram);
    const id = useSimulatorStore.getState().savedPrograms[0].id;
    expect(id).not.toBe(validProgram.id);
    expect(id).toMatch(/^prog-import-/);
  });

  it('persists to localStorage', () => {
    useSimulatorStore.getState().importProgram(validProgram);
    const raw = localStorage.getItem(PERSIST_KEY_SAVED_PROGRAMS);
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].name).toBe('Test Program');
  });

  it('preserves the commands from the imported program', () => {
    useSimulatorStore.getState().importProgram(validProgram);
    const cmds = useSimulatorStore.getState().savedPrograms[0].commands;
    expect(cmds).toHaveLength(3);
    expect(cmds.map((c) => c.type)).toEqual(['forward', 'left', 'wait']);
  });

  it('prepends to existing programs (newest first)', () => {
    useSimulatorStore.getState().addCommand('backward');
    useSimulatorStore.getState().saveCurrentProgram('Existing');
    useSimulatorStore.getState().clearQueue();
    useSimulatorStore.getState().importProgram(validProgram);
    expect(useSimulatorStore.getState().savedPrograms[0].name).toBe('Test Program');
    expect(useSimulatorStore.getState().savedPrograms[1].name).toBe('Existing');
  });
});
