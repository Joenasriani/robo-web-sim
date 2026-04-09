export interface RobotState {
  position: { x: number; y: number; z: number };
  rotation: number; // radians, Y axis
  isMoving: boolean;
  isRunningQueue: boolean;
  isPaused: boolean;
  health: 'ok' | 'hit_obstacle' | 'reached_target';
}

export const INITIAL_ROBOT_STATE: RobotState = {
  position: { x: 0, y: 0.25, z: 0 },
  rotation: 0,
  isMoving: false,
  isRunningQueue: false,
  isPaused: false,
  health: 'ok',
};
