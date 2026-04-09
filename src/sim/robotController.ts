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
  setFeedback: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
  clearFeedback: () => void;

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

function feedbackForHealth(
  health: RobotState['health'],
  prevMessage: string,
  prevType: SimulatorStore['feedbackType']
): { feedbackMessage: string; feedbackType: SimulatorStore['feedbackType'] } {
  if (health === 'hit_obstacle') return { feedbackMessage: '💥 Collision detected!', feedbackType: 'error' };
  if (health === 'reached_target') return { feedbackMessage: '🎯 Target reached!', feedbackType: 'success' };
  return { feedbackMessage: prevMessage, feedbackType: prevType };
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

export const useSimulatorStore = create<SimulatorStore>((set, get) => ({
  robot: { ...INITIAL_ROBOT_STATE },
  arena: DEFAULT_ARENA,
  commandQueue: [],
  currentCommandIndex: null,
  completedLessons: loadCompletedLessons(),

  simSpeed: 1,
  moveStep: DEFAULT_MOVE_STEP,
  turnStep: DEFAULT_TURN_STEP,

  feedbackMessage: '',
  feedbackType: 'info',

  activeLesson: null,

  moveForward: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => mF(r, s.moveStep), s.arena);
      return { robot, ...feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType) };
    }),

  moveBackward: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => mB(r, s.moveStep), s.arena);
      return { robot, ...feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType) };
    }),

  turnLeft: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => tL(r, s.turnStep), s.arena);
      return { robot, ...feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType) };
    }),

  turnRight: () =>
    set((s) => {
      const robot = applyMove(s.robot, (r) => tR(r, s.turnStep), s.arena);
      return { robot, ...feedbackForHealth(robot.health, s.feedbackMessage, s.feedbackType) };
    }),

  resetRobot: () =>
    set(() => ({
      robot: { ...INITIAL_ROBOT_STATE },
      currentCommandIndex: null,
    })),

  pauseRobot: () =>
    set((s) => ({
      robot: { ...s.robot, isPaused: !s.robot.isPaused },
    })),

  stopRobot: () =>
    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isPaused: false, isMoving: false },
      currentCommandIndex: null,
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

    set((s) => ({ robot: { ...s.robot, isRunningQueue: true, isPaused: false } }));

    for (let i = 0; i < get().commandQueue.length; i++) {
      const current = get();
      if (!current.robot.isRunningQueue) break;

      while (get().robot.isPaused) {
        await new Promise((r) => setTimeout(r, 100));
        if (!get().robot.isRunningQueue) break;
      }
      if (!get().robot.isRunningQueue) break;

      set({ currentCommandIndex: i });

      const cmd = get().commandQueue[i];
      if (cmd.type === 'forward') get().moveForward();
      else if (cmd.type === 'backward') get().moveBackward();
      else if (cmd.type === 'left') get().turnLeft();
      else if (cmd.type === 'right') get().turnRight();

      await new Promise((r) => setTimeout(r, Math.round(600 / get().simSpeed)));
    }

    const wasRunning = get().robot.isRunningQueue;
    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isMoving: false },
      currentCommandIndex: null,
    }));
    if (wasRunning && get().robot.health === 'ok') {
      set({ feedbackMessage: '✅ Queue finished!', feedbackType: 'info' });
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

  setFeedback: (message, type = 'info') =>
    set({ feedbackMessage: message, feedbackType: type }),

  clearFeedback: () => set({ feedbackMessage: '' }),

  setActiveLesson: (id) => set({ activeLesson: id }),

  restartLesson: () => {
    set({
      robot: { ...INITIAL_ROBOT_STATE },
      commandQueue: [],
      currentCommandIndex: null,
      feedbackMessage: '',
    });
  },

  restartQueue: () => {
    const store = get();
    if (store.commandQueue.length === 0) return;
    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isPaused: false, isMoving: false },
      currentCommandIndex: null,
    }));
    setTimeout(() => get().runQueue(), 50);
  },
}));
