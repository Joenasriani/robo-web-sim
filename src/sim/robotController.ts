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
    set((s) => ({
      robot: makeInitialRobot(),
      currentCommandIndex: null,
      simState: 'idle',
      feedbackMessage: '',
      feedbackPriority: 'low',
      eventLog: [...s.eventLog, makeEvent('Robot reset', 'info')].slice(-MAX_EVENT_LOG),
    })),

  pauseRobot: () =>
    set((s) => {
      const isPaused = !s.robot.isPaused;
      const newSimState: SimState = s.robot.isRunningQueue ? (isPaused ? 'paused' : 'running') : s.simState;
      const entry = makeEvent(isPaused ? '⏸ Queue paused' : '▶ Queue resumed', 'info');
      return {
        robot: { ...s.robot, isPaused },
        simState: newSimState,
        eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG),
      };
    }),

  stopRobot: () =>
    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isPaused: false, isMoving: false },
      currentCommandIndex: null,
      simState: 'idle',
      eventLog: [...s.eventLog, makeEvent('■ Queue stopped', 'warning')].slice(-MAX_EVENT_LOG),
    })),

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

    // Acquire this run's token — any older loop will see its token is stale and exit
    const myRunId = ++_currentRunId;

    set((s) => ({
      robot: { ...s.robot, isRunningQueue: true, isPaused: false },
      simState: 'running',
      lessonStatus: s.activeLesson && s.lessonStatus === 'not_started' ? 'in_progress' : s.lessonStatus,
      eventLog: [...s.eventLog, makeEvent('▶ Queue started', 'info')].slice(-MAX_EVENT_LOG),
    }));

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

    // Mark queue as ever-completed (ran to end without being stopped)
    const queueEverCompleted = true;

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
    const lesson = LESSONS.find((l) => l.id === id);
    const arena = arenaForLesson(lesson);
    const robot = makeRobotForLesson(lesson, arena);
    if (id) persistLesson(id);
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
      lessonStatus: id === null ? 'not_started' : (s.completedLessons.includes(id) ? 'completed' : 'not_started'),
      eventLog: id
        ? [...s.eventLog, makeEvent(`📖 Lesson started: ${lesson?.title ?? id}`, 'info')].slice(-MAX_EVENT_LOG)
        : s.eventLog,
    }));
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
    const scenario = FREE_PLAY_SCENARIOS.find((s) => s.id === id);
    if (!scenario) return;
    // Cancel any in-flight queue loop
    ++_currentRunId;
    persistFreePlay(id);
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
      eventLog: [...s.eventLog, makeEvent(`🎮 Scenario: ${scenario.title}`, 'info')].slice(-MAX_EVENT_LOG),
    }));
  },

  replayFromStart: () => {
    ++_currentRunId;
    const { activeLesson, activeScenarioId } = get();
    if (activeLesson) {
      // Lesson mode: reset to lesson start pose, keep queue, re-run
      const lesson = LESSONS.find((l) => l.id === activeLesson);
      const arena = arenaForLesson(lesson);
      set((s) => ({
        robot: makeRobotForLesson(lesson, arena),
        arena,
        currentCommandIndex: null,
        simState: 'idle',
        feedbackMessage: '',
        feedbackPriority: 'low',
        hasTurned: false,
        queueEverCompleted: false,
        lessonStatus: s.completedLessons.includes(activeLesson) ? 'completed' : 'not_started',
        eventLog: [...s.eventLog, makeEvent('↩ Replay from lesson start', 'info')].slice(-MAX_EVENT_LOG),
      }));
    } else if (activeScenarioId) {
      // Free-play mode: reset to scenario start pose, keep queue, re-run
      const scenario = FREE_PLAY_SCENARIOS.find((s) => s.id === activeScenarioId);
      if (!scenario) return;
      set((s) => ({
        robot: makeRobotForScenario(scenario),
        currentCommandIndex: null,
        simState: 'idle',
        feedbackMessage: '',
        feedbackPriority: 'low',
        hasTurned: false,
        queueEverCompleted: false,
        eventLog: [...s.eventLog, makeEvent('↩ Replay from start', 'info')].slice(-MAX_EVENT_LOG),
      }));
    }
    // Re-run the queue from the start
    get().runQueue();
  },

  hydrateFromStorage: () => {
    const mode       = safeLocalGet(PERSIST_KEY_MODE);
    const scenarioId = safeLocalGet(PERSIST_KEY_SCENARIO);
    const lessonId   = safeLocalGet(PERSIST_KEY_LESSON);

    if (mode === 'lesson' && lessonId) {
      const lesson = LESSONS.find((l) => l.id === lessonId);
      if (lesson) {
        get().setActiveLesson(lessonId);
        return;
      }
    }
    if (mode === 'free_play' && scenarioId) {
      const scenario = FREE_PLAY_SCENARIOS.find((s) => s.id === scenarioId);
      if (scenario) {
        get().loadScenario(scenarioId);
        return;
      }
    }
    // Fallback: load default arena
    get().loadScenario('default-arena');
  },
}));
