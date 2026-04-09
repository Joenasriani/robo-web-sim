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
import { LESSONS } from '@/lessons/lessonData';

// Explicit simulator state enum
export type SimState = 'idle' | 'running' | 'paused' | 'completed' | 'blocked';

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

function makeInitialRobot(): RobotState {
  return {
    ...INITIAL_ROBOT_STATE,
    sensors: computeSensors(INITIAL_ROBOT_STATE, DEFAULT_ARENA),
  };
}

// Build a robot starting at a lesson-specific pose (if provided)
function makeRobotForLesson(lesson: (typeof LESSONS)[number] | undefined): RobotState {
  if (lesson?.startPose) {
    const base: RobotState = {
      ...INITIAL_ROBOT_STATE,
      position: lesson.startPose.position,
      rotation: lesson.startPose.rotation,
    };
    return { ...base, sensors: computeSensors(base, DEFAULT_ARENA) };
  }
  return makeInitialRobot();
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
      return { robot, ...healthFeedback, simState: newSimState, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG) };
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
      return { robot, ...healthFeedback, simState: newSimState, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG) };
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
      return { robot, ...healthFeedback, simState: newSimState, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG) };
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
      return { robot, ...healthFeedback, simState: newSimState, eventLog: [...s.eventLog, entry].slice(-MAX_EVENT_LOG) };
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

    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isMoving: false },
      currentCommandIndex: null,
      simState: finalSimState,
    }));

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
    set({ completedLessons: updated });
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

  setActiveLesson: (id) => set({ activeLesson: id }),

  restartLesson: () => {
    // Increment runId to cancel any in-flight queue loop
    ++_currentRunId;
    const activeId = get().activeLesson;
    const lesson = LESSONS.find((l) => l.id === activeId);
    set((s) => ({
      robot: makeRobotForLesson(lesson),
      commandQueue: [],
      currentCommandIndex: null,
      feedbackMessage: '',
      feedbackPriority: 'low',
      simState: 'idle',
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
}));
