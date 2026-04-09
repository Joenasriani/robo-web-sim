import { RobotState } from './robotState';

export const MOVE_STEP = 0.5;
export const TURN_STEP = Math.PI / 8;

export function moveForward(state: RobotState): Partial<RobotState> {
  return {
    position: {
      x: state.position.x + Math.sin(state.rotation) * MOVE_STEP,
      y: state.position.y,
      z: state.position.z + Math.cos(state.rotation) * MOVE_STEP,
    },
  };
}

export function moveBackward(state: RobotState): Partial<RobotState> {
  return {
    position: {
      x: state.position.x - Math.sin(state.rotation) * MOVE_STEP,
      y: state.position.y,
      z: state.position.z - Math.cos(state.rotation) * MOVE_STEP,
    },
  };
}

export function turnLeft(state: RobotState): Partial<RobotState> {
  return { rotation: state.rotation - TURN_STEP };
}

export function turnRight(state: RobotState): Partial<RobotState> {
  return { rotation: state.rotation + TURN_STEP };
}
