import { create } from 'zustand';
import { RobotState, INITIAL_ROBOT_STATE } from './robotState';
import { ArenaConfig, DEFAULT_ARENA } from './arenaConfig';
import {
  moveForward as mF,
  moveBackward as mB,
  turnLeft as tL,
  turnRight as tR,
  DEFAULT_MOVE_STEP,
  DEFAULT_TURN_STEP,
} from './motionSystem';
import { checkCollisions, computeSensors } from './collisionHelpers';
import { Command, CommandType, createCommand } from './commandExecution';
import { LESSONS, Lesson, CompletionRules } from '@/lessons/lessonData';
import { arenaForLesson } from '@/scenarios/arenaLoader';
import { FREE_PLAY_SCENARIOS, ScenarioExample } from '@/scenarios';
import { isValidScenarioId, isValidLessonId, isValidArena } from './validation';
import { getModelById } from '@/models/modelLibrary';
import {
  SavedScene,
  loadSavedScenesFromStorage,
  persistSavedScenes,
  isValidSavedScene,
} from './savedScenes';
import {
  SavedProgram,
  loadSavedProgramsFromStorage,
  persistSavedPrograms,
  isValidSavedProgram,
} from './savedPrograms';

export { PERSIST_KEY_SAVED_SCENES } from './savedScenes';
export { PERSIST_KEY_SAVED_PROGRAMS } from './savedPrograms';

// Explicit simulator state enum
export type SimState = 'idle' | 'running' | 'paused' | 'completed' | 'blocked';

// Lesson-level status
export type LessonStatus = 'not_started' | 'in_progress' | 'completed' | 'failed';

// Event log entry
export interface EventEntry {
  id: number;
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

export interface PlacementToolState {
  modelId: string;
  modelName: string;
  size: [number, number, number];
  color: string;
  glbUrl?: string;
}

const MAX_EVENT_LOG = 20;
let _eventIdCounter = 0;

function makeEvent(message: string, type: EventEntry['type']): EventEntry {
  return { id: ++_eventIdCounter, timestamp: Date.now(), message, type };
}

// Module-level run ID — incremented on each runQueue call to cancel stale loops
let _currentRunId = 0;

// ---------------------------------------------------------------------------
// Completion-rule helpers
// ---------------------------------------------------------------------------

/** Resolve effective completion rules for a lesson. Defaults to { reachTarget: true }. */
function effectiveRules(lesson: Lesson | undefined): CompletionRules {
  return lesson?.completionRules ?? { reachTarget: true };
}

/**
 * Evaluate whether a lesson is completed or failed given the current robot
 * health, turn history and queue-completion history.
 */
function evaluateCompletion(
  lesson: Lesson | undefined,
  robotHealth: RobotState['health'],
  hasTurned: boolean,
  queueEverCompleted: boolean,
): { completed: boolean; failed: boolean } {
  const rules = effectiveRules(lesson);

  // Failure: collision occurred while avoidCollision is required
  if (rules.avoidCollision && robotHealth === 'hit_obstacle') {
    return { completed: false, failed: true };
  }

  const reachTargetOk       = !rules.reachTarget       || robotHealth === 'reached_target';
  const avoidCollisionOk    = !rules.avoidCollision     || robotHealth !== 'hit_obstacle';
  const makeAtLeastOneTurnOk = !rules.makeAtLeastOneTurn || hasTurned;
  const completeQueueOk     = !rules.completeQueue      || queueEverCompleted;

  return {
    completed: reachTargetOk && avoidCollisionOk && makeAtLeastOneTurnOk && completeQueueOk,
    failed: false,
  };
}

export interface SimulatorStore {
  robot: RobotState;
  arena: ArenaConfig;
  commandQueue: Command[];
  currentCommandIndex: number | null;
  completedLessons: string[];

  // Settings
  simSpeed: number;
  moveStep: number;
  turnStep: number;

  // Feedback
  feedbackMessage: string;
  feedbackType: 'info' | 'success' | 'error' | 'warning';
  feedbackPriority: 'low' | 'high';

  // Explicit simulator state
  simState: SimState;

  // Event log (ring buffer)
  eventLog: EventEntry[];

  // Active lesson
  activeLesson: string | null;

  // Active free-play scenario (null when a lesson is active)
  activeScenarioId: string | null;

  // Lesson-level status
  lessonStatus: LessonStatus;

  // Completion-rule tracking
  hasTurned: boolean;
  queueEverCompleted: boolean;

  // ---------------------------------------------------------------------------
  // Arena editor (free-play only)
  // ---------------------------------------------------------------------------
  /** True when the user has the arena editor open (free-play mode only). */
  isEditMode: boolean;
  /** Currently selected obstacle or target in edit mode. */
  selectedEditObject: { type: 'obstacle' | 'target'; id: string } | null;
  /** Active model placement tool used for click-to-place editing. */
  placementTool: PlacementToolState | null;
  /** Current hover preview position for the active placement tool. */
  placementPreviewPosition: [number, number, number] | null;
  /** Snapshot of the active scenario's default arena used to power "Reset Arena". */
  defaultArenaSnapshot: ArenaConfig | null;

  // Robot controls
  moveForward: () => void;
  moveBackward: () => void;
  turnLeft: () => void;
  turnRight: () => void;
  resetRobot: () => void;
  pauseRobot: () => void;
  stopRobot: () => void;

  // Command queue
  addCommand: (type: CommandType) => void;
  removeLastCommand: () => void;
  clearQueue: () => void;
  runQueue: () => Promise<void>;
  setCurrentCommandIndex: (index: number | null) => void;

  // Lessons
  completeLesson: (lessonId: string) => void;
  resetLessonProgress: () => void;

  // Scenarios
  loadScenario: (id: string) => void;

  // Settings setters
  setSimSpeed: (speed: number) => void;
  setMoveStep: (step: number) => void;
  setTurnStep: (step: number) => void;

  // Feedback
  setFeedback: (message: string, type?: 'info' | 'success' | 'error' | 'warning', priority?: 'low' | 'high') => void;
  clearFeedback: () => void;

  // Event log
  appendEvent: (message: string, type?: EventEntry['type']) => void;

  // Lesson helpers
  setActiveLesson: (id: string | null) => void;
  restartLesson: () => void;
  restartQueue: () => void;
  replayFromStart: () => void;
  hydrateFromStorage: () => void;

  // Hydration guard — false until hydrateFromStorage completes on the client
  isHydrated: boolean;

  // Arena editor actions
  setEditMode: (active: boolean) => void;
  selectEditObject: (type: 'obstacle' | 'target', id: string) => void;
  deselectEditObject: () => void;
  moveSelectedObject: (direction: 'north' | 'south' | 'east' | 'west') => void;
  /** Rotate the selected obstacle by 45° CW or CCW around the Y axis. */
  rotateSelectedObject: (direction: 'cw' | 'ccw') => void;
  deleteSelectedObstacle: () => void;
  /** Duplicate the selected obstacle, placing the copy nearby. */
  duplicateSelectedObstacle: () => void;
  addObstacle: () => void;
  resetArenaToDefault: () => void;

  // Model library (free-play only)
  /** Place a curated model from the library into the current free-play arena. */
  placeModelFromLibrary: (modelId: string) => void;
  selectPlacementTool: (modelId: string) => void;
  clearPlacementTool: () => void;
  setPlacementPreviewPosition: (position: [number, number, number] | null) => void;
  placeSelectedModelAt: (position: [number, number, number]) => void;

  // ---------------------------------------------------------------------------
  // Saved scenes (free-play only, local-only)
  // ---------------------------------------------------------------------------
  /** All user-saved free-play scenes, ordered newest first. */
  savedScenes: SavedScene[];
  /** Save the current free-play arena under `name`. No-op in lesson mode. */
  saveCurrentScene: (name: string) => void;
  /** Load a previously saved scene into free-play. Replaces current arena state. */
  loadSavedScene: (id: string) => void;
  /** Rename a saved scene. */
  renameSavedScene: (id: string, name: string) => void;
  /** Permanently delete a saved scene. */
  deleteSavedScene: (id: string) => void;

  // ---------------------------------------------------------------------------
  // Saved programs (command sequences, local-only)
  // ---------------------------------------------------------------------------
  /** All user-saved command programs, ordered newest first. */
  savedPrograms: SavedProgram[];
  /** Save the current command queue as a named program. No-op when queue is empty. */
  saveCurrentProgram: (name: string) => void;
  /** Load a saved program into the command queue. Replaces the current queue. */
  loadSavedProgram: (id: string) => void;
  /** Rename a saved program. */
  renameSavedProgram: (id: string, name: string) => void;
  /** Permanently delete a saved program. */
  deleteSavedProgram: (id: string) => void;
  /** Import a validated program (e.g. from a JSON file) and add it to the saved programs list. */
  importProgram: (program: SavedProgram) => void;
}

function applyMove(
  current: RobotState,
  mover: (s: RobotState) => Partial<RobotState>,
  arena: ArenaConfig
): RobotState {
  const next = { ...current, ...mover(current) };
  const health = checkCollisions(next, arena);
  const sensors = computeSensors({ ...next, health }, arena);
  return { ...next, health, sensors };
}

// Returns feedback fields; high priority for collision/target so queue-finish can't overwrite them
function feedbackForHealth(
  health: RobotState['health'],
  prevMessage: string,
  prevType: SimulatorStore['feedbackType'],
  prevPriority: SimulatorStore['feedbackPriority']
): {
  feedbackMessage: string;
  feedbackType: SimulatorStore['feedbackType'];
  feedbackPriority: SimulatorStore['feedbackPriority'];
} {
  if (health === 'hit_obstacle') return { feedbackMessage: '💥 Collision detected!', feedbackType: 'error', feedbackPriority: 'high' };
  if (health === 'reached_target') return { feedbackMessage: '🎯 Target reached!', feedbackType: 'success', feedbackPriority: 'high' };
  return { feedbackMessage: prevMessage, feedbackType: prevType, feedbackPriority: prevPriority };
}

const STORAGE_KEY = 'robo-web-sim-completed-lessons';

// ---------------------------------------------------------------------------
// Context persistence keys
// ---------------------------------------------------------------------------
export const PERSIST_KEY_MODE     = 'robo-web-sim-mode';
export const PERSIST_KEY_SCENARIO = 'robo-web-sim-active-scenario';
export const PERSIST_KEY_LESSON   = 'robo-web-sim-active-lesson';

function safeLocalGet(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function safeLocalSet(key: string, value: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { /* ignore */ }
}

function loadCompletedLessons(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCompletedLessons(lessons: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}

/** Persist free-play context to localStorage. */
function persistFreePlay(scenarioId: string) {
  safeLocalSet(PERSIST_KEY_MODE, 'free_play');
  safeLocalSet(PERSIST_KEY_SCENARIO, scenarioId);
  safeLocalSet(PERSIST_KEY_LESSON, null);
}

/** Persist lesson context to localStorage. */
function persistLesson(lessonId: string) {
  safeLocalSet(PERSIST_KEY_MODE, 'lesson');
  safeLocalSet(PERSIST_KEY_LESSON, lessonId);
  safeLocalSet(PERSIST_KEY_SCENARIO, null);
}

function makeInitialRobot(): RobotState {
  return {
    ...INITIAL_ROBOT_STATE,
    sensors: computeSensors(INITIAL_ROBOT_STATE, DEFAULT_ARENA),
  };
}

// Build a robot starting at a lesson-specific pose (if provided), using the lesson's arena.
function makeRobotForLesson(lesson: Lesson | undefined, arena: ArenaConfig): RobotState {
  if (lesson?.startPose) {
    const base: RobotState = {
      ...INITIAL_ROBOT_STATE,
      position: lesson.startPose.position,
      rotation: lesson.startPose.rotation,
    };
    return { ...base, sensors: computeSensors(base, arena) };
  }
  return {
    ...INITIAL_ROBOT_STATE,
    sensors: computeSensors(INITIAL_ROBOT_STATE, arena),
  };
}

// Build a robot placed at the scenario's start pose.
function makeRobotForScenario(scenario: ScenarioExample): RobotState {
  const base: RobotState = {
    ...INITIAL_ROBOT_STATE,
    position: scenario.startPose.position,
    rotation: scenario.startPose.rotation,
  };
  return { ...base, sensors: computeSensors(base, scenario.arena) };
}

/**
 * Compute the new lessonStatus and completedLessons list after a robot action.
 * Pass `turnedThisStep = true` when a turn was just executed.
 */
function applyLessonStatusUpdate(
  activeLesson: string | null,
  prevLessonStatus: LessonStatus,
  prevCompletedLessons: string[],
  robotHealth: RobotState['health'],
  hasTurned: boolean,
  queueEverCompleted: boolean,
): { lessonStatus: LessonStatus; completedLessons: string[] } {
  // Once completed, stay completed
  if (prevLessonStatus === 'completed') {
    return { lessonStatus: 'completed', completedLessons: prevCompletedLessons };
  }

  const activeLessonObj = LESSONS.find((l) => l.id === activeLesson);
  const { completed, failed } = evaluateCompletion(activeLessonObj, robotHealth, hasTurned, queueEverCompleted);

  const lessonStatus: LessonStatus =
    completed ? 'completed'
    : failed ? 'failed'
    : activeLesson ? 'in_progress'
    : prevLessonStatus;

  let completedLessons = prevCompletedLessons;
  if (completed && activeLesson && !completedLessons.includes(activeLesson)) {
    completedLessons = [...completedLessons, activeLesson];
    saveCompletedLessons(completedLessons);
  }

  return { lessonStatus, completedLessons };
}

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  robot: makeInitialRobot(),
  arena: DEFAULT_ARENA,
  commandQueue: [],
  currentCommandIndex: null,
  completedLessons: loadCompletedLessons(),

  simSpeed: 1,
  moveStep: DEFAULT_MOVE_STEP,
  turnStep: DEFAULT_TURN_STEP,

  feedbackMessage: '',
  feedbackType: 'info',
  feedbackPriority: 'low',

  simState: 'idle',
  eventLog: [],

  activeLesson: null,
  activeScenarioId: 'default-arena',
  lessonStatus: 'not_started',
  hasTurned: false,
  queueEverCompleted: false,
  isHydrated: false,
  isEditMode: false,
  selectedEditObject: null,
  placementTool: null,
  placementPreviewPosition: null,
  defaultArenaSnapshot: DEFAULT_ARENA,

  savedScenes: loadSavedScenesFromStorage(),
  savedPrograms: loadSavedProgramsFromStorage(),

  moveForward: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => mF(r, s.moveStep), s.arena);
      const healthFeedback = feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType, s.feedbackPriority);
      const newSimState: SimState =
        robot.health === 'hit_obstacle' ? 'blocked'
        : robot.health === 'reached_target' ? 'completed'
        : s.simState;
      const entry =
        robot.health === 'hit_obstacle' ? makeEvent('💥 Collision!', 'error')
        : robot.health === 'reached_target' ? makeEvent('🎯 Target reached!', 'success')
        : makeEvent('Moved forward', 'info');

      const { lessonStatus: newLessonStatus, completedLessons } = applyLessonStatusUpdate(
        s.activeLesson, s.lessonStatus, s.completedLessons, robot.health, s.hasTurned, s.queueEverCompleted,
      );

      return { robot, ...healthFeedback, simState: newSimState, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG), lessonStatus: newLessonStatus, completedLessons };
    }),

  moveBackward: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => mB(r, s.moveStep), s.arena);
      const healthFeedback = feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType, s.feedbackPriority);
      const newSimState: SimState =
        robot.health === 'hit_obstacle' ? 'blocked'
        : robot.health === 'reached_target' ? 'completed'
        : s.simState;
      const entry =
        robot.health === 'hit_obstacle' ? makeEvent('💥 Collision!', 'error')
        : robot.health === 'reached_target' ? makeEvent('🎯 Target reached!', 'success')
        : makeEvent('Moved backward', 'info');

      const { lessonStatus: newLessonStatus, completedLessons } = applyLessonStatusUpdate(
        s.activeLesson, s.lessonStatus, s.completedLessons, robot.health, s.hasTurned, s.queueEverCompleted,
      );

      return { robot, ...healthFeedback, simState: newSimState, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG), lessonStatus: newLessonStatus, completedLessons };
    }),

  turnLeft: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => tL(r, s.turnStep), s.arena);
      const healthFeedback = feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType, s.feedbackPriority);
      const newSimState: SimState =
        robot.health === 'hit_obstacle' ? 'blocked'
        : robot.health === 'reached_target' ? 'completed'
        : s.simState;
      const entry =
        robot.health === 'hit_obstacle' ? makeEvent('💥 Collision!', 'error')
        : robot.health === 'reached_target' ? makeEvent('🎯 Target reached!', 'success')
        : makeEvent('Turned left', 'info');

      const hasTurned = true;
      const { lessonStatus: newLessonStatus, completedLessons } = applyLessonStatusUpdate(
        s.activeLesson, s.lessonStatus, s.completedLessons, robot.health, hasTurned, s.queueEverCompleted,
      );

      return { robot, ...healthFeedback, simState: newSimState, hasTurned, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG), lessonStatus: newLessonStatus, completedLessons };
    }),

  turnRight: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => tR(r, s.turnStep), s.arena);
      const healthFeedback = feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType, s.feedbackPriority);
      const newSimState: SimState =
        robot.health === 'hit_obstacle' ? 'blocked'
        : robot.health === 'reached_target' ? 'completed'
        : s.simState;
      const entry =
        robot.health === 'hit_obstacle' ? makeEvent('💥 Collision!', 'error')
        : robot.health === 'reached_target' ? makeEvent('🎯 Target reached!', 'success')
        : makeEvent('Turned right', 'info');

      const hasTurned = true;
      const { lessonStatus: newLessonStatus, completedLessons } = applyLessonStatusUpdate(
        s.activeLesson, s.lessonStatus, s.completedLessons, robot.health, hasTurned, s.queueEverCompleted,
      );

      return { robot, ...healthFeedback, simState: newSimState, hasTurned, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG), lessonStatus: newLessonStatus, completedLessons };
    }),

  resetRobot: () =>
    set((s) => {
      let robot: RobotState;
      if (s.activeLesson) {
        const lesson = LESSONS.find((l) => l.id === s.activeLesson);
        const arena = arenaForLesson(lesson);
        robot = makeRobotForLesson(lesson, arena);
      } else if (s.activeScenarioId) {
        const scenario = FREE_PLAY_SCENARIOS.find((sc) => sc.id === s.activeScenarioId);
        robot = scenario ? makeRobotForScenario(scenario) : makeInitialRobot();
      } else {
        robot = makeInitialRobot();
      }
      return {
        robot,
        currentCommandIndex: null,
        simState: 'idle',
        feedbackMessage: '',
        feedbackPriority: 'low',
        eventLog: [...s.eventLog, makeEvent('Robot reset', 'info')].slice(-MAX_EVENT_LOG),
      };
    }),

  pauseRobot: () =>
    set((s) => {
      // Guard: pause/resume only makes sense while the queue is running
      if (!s.robot.isRunningQueue) return {};
      const isPaused = !s.robot.isPaused;
      const newSimState: SimState = isPaused ? 'paused' : 'running';
      const entry = makeEvent(isPaused ? '⏸ Queue paused' : '▶ Queue resumed', 'info');
      return {
        robot: { ...s.robot, isPaused },
        simState: newSimState,
        eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG),
      };
    }),

  stopRobot: () => {
    // Invalidate any in-flight async queue loop so it cannot overwrite the stopped/idle state.
    ++_currentRunId;
    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isPaused: false, isMoving: false },
      currentCommandIndex: null,
      simState: 'idle',
      eventLog: [...s.eventLog, makeEvent('■ Queue stopped', 'warning')].slice(-MAX_EVENT_LOG),
    }));
  },

  addCommand: (type) =>
    set((s) => ({
      commandQueue: [...s.commandQueue, createCommand(type)],
    })),

  removeLastCommand: () =>
    set((s) => ({
      commandQueue: s.commandQueue.slice(0, -1),
    })),

  clearQueue: () => set({ commandQueue: [], currentCommandIndex: null }),

  setCurrentCommandIndex: (index) => set({ currentCommandIndex: index }),

  runQueue: async () => {
    const store = get();
    if (store.commandQueue.length === 0) return;
    if (store.robot.isRunningQueue) return;

    // Increment before set() so concurrent calls that passed the guard above
    // will see a stale myRunId when they check after set() completes.
    const myRunId = ++_currentRunId;

    set((s) => ({
      robot: { ...s.robot, isRunningQueue: true, isPaused: false, health: 'ok' },
      simState: 'running',
      lessonStatus: s.activeLesson && s.lessonStatus === 'not_started' ? 'in_progress' : s.lessonStatus,
      eventLog: [...s.eventLog, makeEvent('▶ Queue started', 'info')].slice(-MAX_EVENT_LOG),
    }));

    // If another call raced in and took the slot, bail
    if (myRunId !== _currentRunId) return;

    // Track whether the loop exited early due to a collision (not normal completion or target reached)
    let exitedDueToCollision = false;
    let exitedEarlyAtTarget = false;

    for (let i = 0; i < get().commandQueue.length; i++) {
      // Exit if this run was superseded (restart) or explicitly stopped
      if (myRunId !== _currentRunId) break;
      if (!get().robot.isRunningQueue) break;

      // Pause loop — wait until resumed or stopped
      while (get().robot.isPaused) {
        await new Promise((r) => setTimeout(r, 100));
        if (myRunId !== _currentRunId) break;
        if (!get().robot.isRunningQueue) break;
      }
      if (myRunId !== _currentRunId) break;
      if (!get().robot.isRunningQueue) break;

      set({ currentCommandIndex: i });

      const cmd = get().commandQueue[i];
      if (cmd.type === 'forward') get().moveForward();
      else if (cmd.type === 'backward') get().moveBackward();
      else if (cmd.type === 'left') get().turnLeft();
      else if (cmd.type === 'right') get().turnRight();
      else if (cmd.type === 'wait') {
        // Log the wait event explicitly
        set((s) => ({
          eventLog: [...s.eventLog, makeEvent('⏸ Waited', 'info')].slice(-MAX_EVENT_LOG),
        }));
      }

      // Stop immediately on terminal robot states — no further commands should run
      const cmdHealth = get().robot.health;
      if (cmdHealth === 'hit_obstacle') {
        exitedDueToCollision = true;
        break;
      }
      if (cmdHealth === 'reached_target') {
        // Check if there are commands remaining
        if (i < get().commandQueue.length - 1) {
          exitedEarlyAtTarget = true;
        }
        break;
      }

      await new Promise((r) => setTimeout(r, Math.round(600 / get().simSpeed)));
    }

    // Only clean up if this is still the active run
    if (myRunId !== _currentRunId) return;

    const finalHealth = get().robot.health;
    const wasRunning = get().robot.isRunningQueue;

    const finalSimState: SimState =
      finalHealth === 'hit_obstacle' ? 'blocked'
      : finalHealth === 'reached_target' ? 'completed'
      : 'idle';

    // Queue "ever completed" = ran all commands without a collision or early target exit
    const queueEverCompleted = !exitedDueToCollision && !exitedEarlyAtTarget;

    set((s) => {
      const { lessonStatus: newLessonStatus, completedLessons } = applyLessonStatusUpdate(
        s.activeLesson, s.lessonStatus, s.completedLessons, finalHealth, s.hasTurned, queueEverCompleted,
      );
      return {
        robot: { ...s.robot, isRunningQueue: false, isMoving: false },
        currentCommandIndex: null,
        simState: finalSimState,
        queueEverCompleted,
        lessonStatus: newLessonStatus,
        completedLessons,
      };
    });

    // Only show "queue finished" if nothing more urgent is already showing
    if (wasRunning && finalHealth === 'ok') {
      const currentPriority = get().feedbackPriority;
      if (currentPriority !== 'high') {
        set((s) => ({
          feedbackMessage: '✅ Queue finished!',
          feedbackType: 'info',
          feedbackPriority: 'low',
          eventLog: [...s.eventLog, makeEvent('✅ Queue finished', 'info')].slice(-MAX_EVENT_LOG),
        }));
      }
    }
  },

  completeLesson: (lessonId) => {
    const current = get().completedLessons;
    if (current.includes(lessonId)) return;
    const updated = [...current, lessonId];
    saveCompletedLessons(updated);
    set({ completedLessons: updated, lessonStatus: 'completed' });
  },

  resetLessonProgress: () => {
    saveCompletedLessons([]);
    set({ completedLessons: [] });
  },

  setSimSpeed: (speed) => set({ simSpeed: speed }),
  setMoveStep: (step) => set({ moveStep: step }),
  setTurnStep: (step) => set({ turnStep: step }),

  setFeedback: (message, type = 'info', priority: 'low' | 'high' = 'low') => {
    const current = get();
    // Don't overwrite a high-priority message with a low-priority one
    if (priority === 'low' && current.feedbackPriority === 'high') return;
    set({ feedbackMessage: message, feedbackType: type, feedbackPriority: priority });
  },

  clearFeedback: () => set({ feedbackMessage: '', feedbackPriority: 'low' }),

  appendEvent: (message, type = 'info') =>
    set((s) => ({
      eventLog: [...s.eventLog, makeEvent(message, type)].slice(-MAX_EVENT_LOG),
    })),

  setActiveLesson: (id) => {
    // Validate lesson ID — fall back to default-arena if unknown
    if (id !== null && !isValidLessonId(id)) {
      get().loadScenario('default-arena');
      return;
    }
    const lesson = LESSONS.find((l) => l.id === id);
    const arena = arenaForLesson(lesson);
    // Defensive arena shape check
    if (!isValidArena(arena)) {
      get().loadScenario('default-arena');
      return;
    }
    const robot = makeRobotForLesson(lesson, arena);
    set((s) => ({
      activeLesson: id,
      activeScenarioId: null,   // clear free-play scenario when a lesson is loaded
      arena,
      robot,
      commandQueue: [],
      currentCommandIndex: null,
      simState: 'idle',
      feedbackMessage: '',
      feedbackPriority: 'low',
      hasTurned: false,
      queueEverCompleted: false,
      isEditMode: false,
      selectedEditObject: null,
      placementTool: null,
      placementPreviewPosition: null,
      lessonStatus: id === null ? 'not_started' : (s.completedLessons.includes(id) ? 'completed' : 'not_started'),
      eventLog: id
        ? [...s.eventLog, makeEvent(`📖 Lesson started: ${lesson?.title ?? id}`, 'info')].slice(-MAX_EVENT_LOG)
        : s.eventLog,
    }));
    if (id) persistLesson(id);
  },

  restartLesson: () => {
    // Increment runId to cancel any in-flight queue loop
    ++_currentRunId;
    const activeId = get().activeLesson;
    const lesson = LESSONS.find((l) => l.id === activeId);
    const arena = arenaForLesson(lesson);
    set((s) => ({
      robot: makeRobotForLesson(lesson, arena),
      arena,
      commandQueue: [],
      currentCommandIndex: null,
      feedbackMessage: '',
      feedbackPriority: 'low',
      simState: 'idle',
      hasTurned: false,
      queueEverCompleted: false,
      isEditMode: false,
      selectedEditObject: null,
      placementTool: null,
      placementPreviewPosition: null,
      lessonStatus: 'not_started',
      eventLog: [...s.eventLog, makeEvent('🔄 Lesson restarted', 'info')].slice(-MAX_EVENT_LOG),
    }));
  },

  restartQueue: () => {
    const store = get();
    if (store.commandQueue.length === 0) return;
    // Increment runId synchronously — the old async loop will exit when it next checks
    ++_currentRunId;
    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isPaused: false, isMoving: false },
      currentCommandIndex: null,
      simState: 'idle',
      eventLog: [...s.eventLog, makeEvent('↩ Queue restarted', 'info')].slice(-MAX_EVENT_LOG),
    }));
    // Kick off the new run; isRunningQueue is now false so runQueue will proceed
    get().runQueue();
  },

  loadScenario: (id) => {
    // Validate scenario ID — silently fall back to default-arena if invalid
    if (!isValidScenarioId(id)) {
      // Avoid infinite recursion: only fall back if we're not already on default-arena
      if (id === 'default-arena') return;
      get().loadScenario('default-arena');
      return;
    }
    const scenario = FREE_PLAY_SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    // Defensive arena shape check
    if (!isValidArena(scenario.arena)) {
      get().loadScenario('default-arena');
      return;
    }
    // Cancel any in-flight queue loop
    ++_currentRunId;
    const robot = makeRobotForScenario(scenario);
    set((s) => ({
      activeScenarioId: id,
      activeLesson: null,
      arena: scenario.arena,
      robot,
      commandQueue: [],
      currentCommandIndex: null,
      simState: 'idle',
      feedbackMessage: '',
      feedbackPriority: 'low',
      hasTurned: false,
      queueEverCompleted: false,
      lessonStatus: 'not_started',
      isEditMode: false,
      selectedEditObject: null,
      placementTool: null,
      placementPreviewPosition: null,
      defaultArenaSnapshot: scenario.arena,
      eventLog: [...s.eventLog, makeEvent(`🎮 Scenario: ${scenario.title}`, 'info')].slice(-MAX_EVENT_LOG),
    }));
    persistFreePlay(id);
  },

  replayFromStart: () => {
    ++_currentRunId;
    const { activeLesson, activeScenarioId, commandQueue } = get();
    if (activeLesson) {
      // Lesson mode: reset to lesson start pose, keep queue, re-run
      const lesson = LESSONS.find((l) => l.id === activeLesson);
      const arena = arenaForLesson(lesson);
      const robot = makeRobotForLesson(lesson, arena);
      set((s) => ({
        robot: {
          ...robot,
          isRunningQueue: false,
          isPaused: false,
          isMoving: false,
        },
        arena,
        currentCommandIndex: null,
        simState: 'idle',
        feedbackMessage: '',
        feedbackType: 'info' as const,
        feedbackPriority: 'low',
        hasTurned: false,
        queueEverCompleted: false,
        lessonStatus: s.completedLessons.includes(activeLesson) ? 'completed' : 'not_started',
        eventLog: [...s.eventLog, makeEvent('↩ Replay from lesson start', 'info')].slice(-MAX_EVENT_LOG),
      }));
    } else if (activeScenarioId) {
      // Free-play mode: reset to scenario start pose using the current (possibly edited) arena,
      // keep queue, re-run
      const scenario = FREE_PLAY_SCENARIOS.find((s) => s.id === activeScenarioId);
      if (!scenario) return;
      // Use the store's current arena so sensors are consistent with what the robot will navigate
      const currentArena = get().arena;
      const base = {
        ...INITIAL_ROBOT_STATE,
        position: scenario.startPose.position,
        rotation: scenario.startPose.rotation,
      };
      const robot = { ...base, sensors: computeSensors(base, currentArena) };
      set((s) => ({
        robot: {
          ...robot,
          isRunningQueue: false,
          isPaused: false,
          isMoving: false,
        },
        currentCommandIndex: null,
        simState: 'idle',
        feedbackMessage: '',
        feedbackType: 'info' as const,
        feedbackPriority: 'low',
        hasTurned: false,
        queueEverCompleted: false,
        lessonStatus: 'not_started',
        eventLog: [...s.eventLog, makeEvent('↩ Replay from start', 'info')].slice(-MAX_EVENT_LOG),
      }));
    } else {
      // No active context — nothing to replay
      return;
    }
    // Re-run the queue only if it has commands; otherwise the reset above is sufficient
    if (commandQueue.length > 0) {
      get().runQueue();
    }
  },

  hydrateFromStorage: () => {
    const mode       = safeLocalGet(PERSIST_KEY_MODE);
    const scenarioId = safeLocalGet(PERSIST_KEY_SCENARIO);
    const lessonId   = safeLocalGet(PERSIST_KEY_LESSON);

    if (mode === 'lesson' && isValidLessonId(lessonId)) {
      get().setActiveLesson(lessonId);
      set({ isHydrated: true });
      return;
    }
    if (mode === 'free_play' && isValidScenarioId(scenarioId)) {
      get().loadScenario(scenarioId);
      set({ isHydrated: true });
      return;
    }
    // Fallback: load default arena
    get().loadScenario('default-arena');
    set({ isHydrated: true });
  },

  // ---------------------------------------------------------------------------
  // Arena editor actions (free-play only)
  // ---------------------------------------------------------------------------

  setEditMode: (active) => {
    if (active) {
      set({ isEditMode: true });
    } else {
      set({
        isEditMode: false,
        selectedEditObject: null,
        placementTool: null,
        placementPreviewPosition: null,
      });
    }
  },

  selectEditObject: (type, id) => {
    set({
      selectedEditObject: { type, id },
      placementTool: null,
      placementPreviewPosition: null,
    });
  },

  deselectEditObject: () => {
    set({ selectedEditObject: null });
  },

  moveSelectedObject: (direction) => {
    const { selectedEditObject, arena } = get();
    if (!selectedEditObject) return;

    const STEP = 0.5;
    const half = arena.size / 2 - 0.6; // margin so objects stay visibly inside walls

    const applyDelta = (pos: [number, number, number]): [number, number, number] => {
      let x = pos[0];
      const y = pos[1];
      let z = pos[2];
      if (direction === 'north') z -= STEP;
      else if (direction === 'south') z += STEP;
      else if (direction === 'east')  x += STEP;
      else if (direction === 'west')  x -= STEP;
      // Clamp to arena bounds
      x = Math.max(-half, Math.min(half, x));
      z = Math.max(-half, Math.min(half, z));
      return [x, y, z];
    };

    if (selectedEditObject.type === 'obstacle') {
      const obstacles = arena.obstacles.map((obs) =>
        obs.id === selectedEditObject.id
          ? { ...obs, position: applyDelta(obs.position) }
          : obs
      );
      const newArena = { ...arena, obstacles };
      const robot = { ...get().robot, sensors: computeSensors(get().robot, newArena) };
      set((s) => ({
        arena: newArena,
        robot,
        eventLog: [...s.eventLog, makeEvent('✏️ Obstacle moved', 'info')].slice(-MAX_EVENT_LOG),
      }));
    } else if (selectedEditObject.type === 'target') {
      const targets = arena.targets.map((t) =>
        t.id === selectedEditObject.id
          ? { ...t, position: applyDelta(t.position) }
          : t
      );
      const newArena = { ...arena, targets };
      const robot = { ...get().robot, sensors: computeSensors(get().robot, newArena) };
      set((s) => ({
        arena: newArena,
        robot,
        eventLog: [...s.eventLog, makeEvent('✏️ Target moved', 'info')].slice(-MAX_EVENT_LOG),
      }));
    }
  },

  deleteSelectedObstacle: () => {
    const { selectedEditObject, arena } = get();
    if (!selectedEditObject || selectedEditObject.type !== 'obstacle') return;
    const obstacles = arena.obstacles.filter((obs) => obs.id !== selectedEditObject.id);
    const newArena = { ...arena, obstacles };
    const robot = { ...get().robot, sensors: computeSensors(get().robot, newArena) };
    set((s) => ({
      arena: newArena,
      robot,
      selectedEditObject: null,
      eventLog: [...s.eventLog, makeEvent('🗑️ Obstacle removed', 'warning')].slice(-MAX_EVENT_LOG),
    }));
  },

  rotateSelectedObject: (direction) => {
    const { selectedEditObject, arena } = get();
    if (!selectedEditObject || selectedEditObject.type !== 'obstacle') return;
    const ROTATE_STEP = Math.PI / 4; // 45 degrees
    const delta = direction === 'cw' ? ROTATE_STEP : -ROTATE_STEP;
    const obstacles = arena.obstacles.map((obs) =>
      obs.id === selectedEditObject.id
        ? { ...obs, rotation: (obs.rotation ?? 0) + delta }
        : obs
    );
    const newArena = { ...arena, obstacles };
    set((s) => ({
      arena: newArena,
      eventLog: [...s.eventLog, makeEvent('🔄 Obstacle rotated', 'info')].slice(-MAX_EVENT_LOG),
    }));
  },

  duplicateSelectedObstacle: () => {
    const { selectedEditObject, arena } = get();
    if (!selectedEditObject || selectedEditObject.type !== 'obstacle') return;
    const obs = arena.obstacles.find((o) => o.id === selectedEditObject.id);
    if (!obs) return;
    const OFFSET = 1.5;
    const half = arena.size / 2 - 0.6;
    const newX = Math.max(-half, Math.min(half, obs.position[0] + OFFSET));
    const newZ = Math.max(-half, Math.min(half, obs.position[2] + OFFSET));
    const newId = `ml-dup-${Date.now()}`;
    const newObs = {
      ...obs,
      id: newId,
      position: [newX, obs.position[1], newZ] as [number, number, number],
    };
    const newArena = { ...arena, obstacles: [...arena.obstacles, newObs] };
    const robot = { ...get().robot, sensors: computeSensors(get().robot, newArena) };
    set((s) => ({
      arena: newArena,
      robot,
      selectedEditObject: { type: 'obstacle', id: newId },
      eventLog: [...s.eventLog, makeEvent('📋 Obstacle duplicated', 'success')].slice(-MAX_EVENT_LOG),
    }));
  },

  addObstacle: () => {
    const { arena } = get();
    // Pick a position near the center-north that avoids the robot start pose (0,0,0).
    // We cycle through a small grid of x offsets (0..3) to avoid stacking new obstacles.
    const POSITION_CYCLE_RANGE = 4; // number of x positions to cycle through
    const INITIAL_OBSTACLE_X = 0;
    const INITIAL_OBSTACLE_Z = -3;
    let x = INITIAL_OBSTACLE_X;
    const z = INITIAL_OBSTACLE_Z;
    const existingPositions = arena.obstacles.map((o) => `${o.position[0]},${o.position[2]}`);
    let attempt = 0;
    while (existingPositions.includes(`${x},${z}`) && attempt < 8) {
      x = Math.round((x + 1) % POSITION_CYCLE_RANGE);
      attempt++;
    }
    const newId = `obs-edit-${Date.now()}`;
    const newObs = {
      id: newId,
      position: [x, 0.5, z] as [number, number, number],
      size: [1, 1, 1] as [number, number, number],
      color: '#a855f7',
    };
    const newArena = { ...arena, obstacles: [...arena.obstacles, newObs] };
    set((s) => ({
      arena: newArena,
      selectedEditObject: { type: 'obstacle', id: newId },
      eventLog: [...s.eventLog, makeEvent('➕ Obstacle added', 'success')].slice(-MAX_EVENT_LOG),
    }));
  },

  resetArenaToDefault: () => {
    const { defaultArenaSnapshot, activeScenarioId } = get();
    if (!defaultArenaSnapshot) return;
    // Restore the arena snapshot and reset robot sensors
    const robot = { ...get().robot, sensors: computeSensors(get().robot, defaultArenaSnapshot) };
    set((s) => ({
      arena: defaultArenaSnapshot,
      robot,
      selectedEditObject: null,
      isEditMode: false,
      placementTool: null,
      placementPreviewPosition: null,
      eventLog: [
        ...s.eventLog,
        makeEvent(`🔁 Arena reset to ${activeScenarioId ?? 'default'}`, 'info'),
      ].slice(-MAX_EVENT_LOG),
    }));
  },

  placeModelFromLibrary: (modelId) => {
    const { activeLesson, arena } = get();
    // Model library is only available in free-play mode
    if (activeLesson !== null) return;

    const model = getModelById(modelId);
    if (!model) {
      // Unknown model id — fail safely without crashing
      set((s) => ({
        eventLog: [
          ...s.eventLog,
          makeEvent(`⚠️ Unknown model: ${modelId}`, 'warning'),
        ].slice(-MAX_EVENT_LOG),
      }));
      return;
    }

    // Find a placement position that avoids stacking on existing obstacles
    const half = arena.size / 2 - 0.6;
    const existingPositions = new Set(
      arena.obstacles.map((o) => `${o.position[0]},${o.position[2]}`)
    );
    const MAX_PLACEMENT_ATTEMPTS = 8;
    const PLACEMENT_STEP = 1.5;
    const PLACEMENT_GRID_SIZE = 4;
    const INITIAL_CANDIDATE_X = 0;
    const INITIAL_CANDIDATE_Z = -2;
    let candidateX = INITIAL_CANDIDATE_X;
    const candidateZ = INITIAL_CANDIDATE_Z;
    let attempt = 0;
    while (existingPositions.has(`${candidateX},${candidateZ}`) && attempt < MAX_PLACEMENT_ATTEMPTS) {
      candidateX = Math.round((candidateX + PLACEMENT_STEP) % PLACEMENT_GRID_SIZE);
      attempt++;
    }
    const x = Math.max(-half, Math.min(half, candidateX));
    const z = Math.max(-half, Math.min(half, candidateZ));

    const newId = `ml-${model.id}-${Date.now()}`;
    const yOffset = model.placementDefaults.size[1] / 2;
    const newObs = {
      id: newId,
      position: [x, yOffset, z] as [number, number, number],
      size: model.placementDefaults.size,
      color: model.placementDefaults.color,
      modelId: model.id,
      ...(model.glbUrl ? { glbUrl: model.glbUrl } : {}),
    };
    const newArena = { ...arena, obstacles: [...arena.obstacles, newObs] };
    const robot = { ...get().robot, sensors: computeSensors(get().robot, newArena) };
    set((s) => ({
      arena: newArena,
      robot,
      eventLog: [
        ...s.eventLog,
        makeEvent(`📦 Placed: ${model.name}`, 'success'),
      ].slice(-MAX_EVENT_LOG),
    }));
  },

  selectPlacementTool: (modelId) => {
    const { activeLesson, isEditMode } = get();
    if (activeLesson !== null || !isEditMode) return;

    const model = getModelById(modelId);
    if (!model) {
      set((s) => ({
        eventLog: [...s.eventLog, makeEvent(`⚠️ Unknown model: ${modelId}`, 'warning')].slice(-MAX_EVENT_LOG),
      }));
      return;
    }

    set((s) => ({
      placementTool: {
        modelId: model.id,
        modelName: model.name,
        size: model.placementDefaults.size,
        color: model.placementDefaults.color,
        ...(model.glbUrl ? { glbUrl: model.glbUrl } : {}),
      },
      placementPreviewPosition: null,
      selectedEditObject: null,
      eventLog: [...s.eventLog, makeEvent(`🎯 Placement tool selected: ${model.name}`, 'info')].slice(-MAX_EVENT_LOG),
    }));
  },

  clearPlacementTool: () => {
    const { placementTool } = get();
    if (!placementTool) return;
    set({ placementTool: null, placementPreviewPosition: null });
  },

  setPlacementPreviewPosition: (position) => {
    set({ placementPreviewPosition: position });
  },

  placeSelectedModelAt: (position) => {
    const { activeLesson, isEditMode, arena, placementTool } = get();
    if (activeLesson !== null || !isEditMode || !placementTool) return;

    const half = arena.size / 2 - 0.6;
    const x = Math.max(-half, Math.min(half, position[0]));
    const z = Math.max(-half, Math.min(half, position[2]));
    const yOffset = placementTool.size[1] / 2;
    const newId = `ml-${placementTool.modelId}-${Date.now()}`;

    const newObs = {
      id: newId,
      position: [x, yOffset, z] as [number, number, number],
      size: placementTool.size,
      color: placementTool.color,
      modelId: placementTool.modelId,
      ...(placementTool.glbUrl ? { glbUrl: placementTool.glbUrl } : {}),
    };
    const newArena = { ...arena, obstacles: [...arena.obstacles, newObs] };
    const robot = { ...get().robot, sensors: computeSensors(get().robot, newArena) };

    set((s) => ({
      arena: newArena,
      robot,
      placementPreviewPosition: null,
      selectedEditObject: { type: 'obstacle', id: newId },
      eventLog: [...s.eventLog, makeEvent(`📦 Placed: ${placementTool.modelName}`, 'success')].slice(-MAX_EVENT_LOG),
    }));
  },

  saveCurrentScene: (name) => {
    const { activeLesson, activeScenarioId, arena } = get();
    // Saved scenes are free-play only
    if (activeLesson !== null) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newScene: SavedScene = {
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      savedAt: Date.now(),
      scenarioBase: activeScenarioId,
      arena,
    };

    set((s) => {
      const updated = [newScene, ...s.savedScenes];
      persistSavedScenes(updated);
      return {
        savedScenes: updated,
        eventLog: [...s.eventLog, makeEvent(`💾 Scene saved: "${trimmedName}"`, 'success')].slice(-MAX_EVENT_LOG),
      };
    });
  },

  loadSavedScene: (id) => {
    const { activeLesson, savedScenes } = get();
    // Only usable in free-play mode
    if (activeLesson !== null) return;

    const scene = savedScenes.find((s) => s.id === id);
    if (!scene) {
      set((s) => ({
        eventLog: [...s.eventLog, makeEvent('⚠️ Saved scene not found', 'warning')].slice(-MAX_EVENT_LOG),
      }));
      return;
    }

    // Validate before applying
    if (!isValidSavedScene(scene)) {
      set((s) => ({
        eventLog: [...s.eventLog, makeEvent('⚠️ Saved scene data is invalid — load aborted', 'error')].slice(-MAX_EVENT_LOG),
      }));
      return;
    }

    // Cancel any in-flight queue loop
    ++_currentRunId;
    const robot = { ...get().robot, sensors: computeSensors(get().robot, scene.arena) };
    set((s) => ({
      activeScenarioId: scene.scenarioBase ?? s.activeScenarioId,
      activeLesson: null,
      arena: scene.arena,
      robot,
      commandQueue: [],
      currentCommandIndex: null,
      simState: 'idle',
      feedbackMessage: '',
      feedbackPriority: 'low',
      hasTurned: false,
      queueEverCompleted: false,
      lessonStatus: 'not_started',
      isEditMode: false,
      selectedEditObject: null,
      placementTool: null,
      placementPreviewPosition: null,
      // Snapshot the loaded scene's arena so "Reset Arena" restores to the saved state
      defaultArenaSnapshot: scene.arena,
      eventLog: [...s.eventLog, makeEvent(`📂 Scene loaded: "${scene.name}"`, 'info')].slice(-MAX_EVENT_LOG),
    }));
    if (scene.scenarioBase) persistFreePlay(scene.scenarioBase);
  },

  renameSavedScene: (id, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    set((s) => {
      const updated = s.savedScenes.map((sc) =>
        sc.id === id ? { ...sc, name: trimmedName } : sc
      );
      persistSavedScenes(updated);
      return { savedScenes: updated };
    });
  },

  deleteSavedScene: (id) => {
    set((s) => {
      const updated = s.savedScenes.filter((sc) => sc.id !== id);
      persistSavedScenes(updated);
      return {
        savedScenes: updated,
        eventLog: [...s.eventLog, makeEvent('🗑️ Saved scene deleted', 'warning')].slice(-MAX_EVENT_LOG),
      };
    });
  },

  // ---------------------------------------------------------------------------
  // Saved programs actions
  // ---------------------------------------------------------------------------

  saveCurrentProgram: (name) => {
    const { commandQueue } = get();
    const trimmedName = name.trim();
    if (!trimmedName) return;
    if (commandQueue.length === 0) return;

    const now = Date.now();
    const newProgram: SavedProgram = {
      id: `prog-${now}-${Math.random().toString(36).slice(2, 7)}`,
      name: trimmedName,
      commands: commandQueue.map((cmd) => ({ ...cmd })),
      createdAt: now,
      updatedAt: now,
    };

    set((s) => {
      const updated = [newProgram, ...s.savedPrograms];
      persistSavedPrograms(updated);
      return {
        savedPrograms: updated,
        eventLog: [...s.eventLog, makeEvent(`💾 Program saved: "${trimmedName}"`, 'success')].slice(-MAX_EVENT_LOG),
      };
    });
  },

  loadSavedProgram: (id) => {
    const { savedPrograms } = get();

    const program = savedPrograms.find((p) => p.id === id);
    if (!program) {
      set((s) => ({
        eventLog: [...s.eventLog, makeEvent('⚠️ Saved program not found', 'warning')].slice(-MAX_EVENT_LOG),
      }));
      return;
    }

    // Validate before applying
    if (!isValidSavedProgram(program)) {
      set((s) => ({
        eventLog: [...s.eventLog, makeEvent('⚠️ Saved program data is invalid — load aborted', 'error')].slice(-MAX_EVENT_LOG),
      }));
      return;
    }

    // Cancel any in-flight queue loop
    ++_currentRunId;
    // Re-create commands with fresh IDs to avoid any stale-id conflicts
    const newQueue = program.commands.map((cmd) => createCommand(cmd.type));
    set((s) => ({
      commandQueue: newQueue,
      currentCommandIndex: null,
      simState: s.simState === 'running' || s.simState === 'paused' ? 'idle' : s.simState,
      robot: { ...s.robot, isRunningQueue: false, isPaused: false },
      eventLog: [...s.eventLog, makeEvent(`📂 Program loaded: "${program.name}"`, 'info')].slice(-MAX_EVENT_LOG),
    }));
  },

  renameSavedProgram: (id, name) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    set((s) => {
      const updated = s.savedPrograms.map((p) =>
        p.id === id ? { ...p, name: trimmedName, updatedAt: Date.now() } : p
      );
      persistSavedPrograms(updated);
      return { savedPrograms: updated };
    });
  },

  deleteSavedProgram: (id) => {
    set((s) => {
      const updated = s.savedPrograms.filter((p) => p.id !== id);
      persistSavedPrograms(updated);
      return {
        savedPrograms: updated,
        eventLog: [...s.eventLog, makeEvent('🗑️ Saved program deleted', 'warning')].slice(-MAX_EVENT_LOG),
      };
    });
  },

  importProgram: (program) => {
    const now = Date.now();
    const imported: SavedProgram = {
      ...program,
      id: `prog-import-${now}-${Math.random().toString(36).slice(2, 7)}`,
      updatedAt: now,
    };
    set((s) => {
      const updated = [imported, ...s.savedPrograms];
      persistSavedPrograms(updated);
      return {
        savedPrograms: updated,
        eventLog: [...s.eventLog, makeEvent(`📥 Program imported: "${imported.name}"`, 'success')].slice(-MAX_EVENT_LOG),
      };
    });
  },
}));
