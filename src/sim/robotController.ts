import { create } from 'zustand';
import { RobotState, INITIAL_ROBOT_STATE } from './robotState';
import { ArenaConfig, DEFAULT_ARENA } from './arenaConfig';
import { moveForward, moveBackward, turnLeft, turnRight } from './motionSystem';
import { checkCollisions } from './collisionHelpers';
import { Command, CommandType, createCommand } from './commandExecution';

export interface SimulatorStore {
  robot: RobotState;
  arena: ArenaConfig;
  commandQueue: Command[];
  currentCommandIndex: number | null;
  completedLessons: string[];

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
}

function applyMove(current: RobotState, mover: (s: RobotState) => Partial<RobotState>, arena: ArenaConfig): RobotState {
  const next = { ...current, ...mover(current) };
  const health = checkCollisions(next, arena);
  return { ...next, health };
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

  moveForward: () => set((s) => ({ robot: applyMove(s.robot, moveForward, s.arena) })),
  moveBackward: () => set((s) => ({ robot: applyMove(s.robot, moveBackward, s.arena) })),
  turnLeft: () => set((s) => ({ robot: applyMove(s.robot, turnLeft, s.arena) })),
  turnRight: () => set((s) => ({ robot: applyMove(s.robot, turnRight, s.arena) })),

  resetRobot: () => set(() => ({
    robot: { ...INITIAL_ROBOT_STATE },
    currentCommandIndex: null,
  })),

  pauseRobot: () => set((s) => ({
    robot: { ...s.robot, isPaused: !s.robot.isPaused },
  })),

  stopRobot: () => set((s) => ({
    robot: { ...s.robot, isRunningQueue: false, isPaused: false, isMoving: false },
    currentCommandIndex: null,
  })),

  addCommand: (type) => set((s) => ({
    commandQueue: [...s.commandQueue, createCommand(type)],
  })),

  removeLastCommand: () => set((s) => ({
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

      // Wait if paused
      while (get().robot.isPaused) {
        await new Promise((r) => setTimeout(r, 100));
        if (!get().robot.isRunningQueue) break;
      }
      if (!get().robot.isRunningQueue) break;

      set({ currentCommandIndex: i });

      const cmd = current.commandQueue[i];
      if (cmd.type === 'forward') get().moveForward();
      else if (cmd.type === 'backward') get().moveBackward();
      else if (cmd.type === 'left') get().turnLeft();
      else if (cmd.type === 'right') get().turnRight();
      // wait: just delay

      await new Promise((r) => setTimeout(r, 600));
    }

    set((s) => ({
      robot: { ...s.robot, isRunningQueue: false, isMoving: false },
      currentCommandIndex: null,
    }));
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
}));
