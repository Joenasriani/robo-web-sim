export interface SensorData {
  frontDistance: number;   // distance to nearest obstacle/wall in front (capped at 5.0)
  leftObstacle: boolean;   // obstacle within 1.2m at 45° left
  rightObstacle: boolean;  // obstacle within 1.2m at 45° right
  targetDistance: number;  // distance to nearest target
}

export const INITIAL_SENSOR_DATA: SensorData = {
  frontDistance: 5,
  leftObstacle: false,
  rightObstacle: false,
  targetDistance: 99,
};

export interface RobotState {
  position: { x: number; y: number; z: number };
  rotation: number; // radians, Y axis
  isMoving: boolean;
  isRunningQueue: boolean;
  isPaused: boolean;
  health: 'ok' | 'hit_obstacle' | 'reached_target';
  sensors: SensorData;
}

export const INITIAL_ROBOT_STATE: RobotState = {
  position: { x: 0, y: 0.25, z: 0 },
  rotation: 0,
  isMoving: false,
  isRunningQueue: false,
  isPaused: false,
  health: 'ok',
  sensors: { ...INITIAL_SENSOR_DATA },
};
