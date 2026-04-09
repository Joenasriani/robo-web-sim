import { RobotState } from './robotState';

export const DEFAULT_MOVE_STEP = 0.5;
export const DEFAULT_TURN_STEP = Math.PI / 8;

// Backward-compat aliases
export const MOVE_STEP = DEFAULT_MOVE_STEP;
export const TURN_STEP = DEFAULT_TURN_STEP;

export function moveForward(state: RobotState, step: number = DEFAULT_MOVE_STEP): Partial<RobotState> {
  return {
    position: {
      x: state.position.x + Math.sin(state.rotation) * step,
      y: state.position.y,
      z: state.position.z + Math.cos(state.rotation) * step,
    },
  };
}

export function moveBackward(state: RobotState, step: number = DEFAULT_MOVE_STEP): Partial<RobotState> {
  return {
    position: {
      x: state.position.x - Math.sin(state.rotation) * step,
      y: state.position.y,
      z: state.position.z - Math.cos(state.rotation) * step,
    },
  };
}

export function turnLeft(state: RobotState, step: number = DEFAULT_TURN_STEP): Partial<RobotState> {
  return { rotation: state.rotation - step };
}

export function turnRight(state: RobotState, step: number = DEFAULT_TURN_STEP): Partial<RobotState> {
  return { rotation: state.rotation + step };
}
