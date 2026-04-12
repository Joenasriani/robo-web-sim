/**
 * Unit tests for motionSystem helpers.
 *
 * Three.js uses a rotation matrix for Y-axis rotation where positive angle
 * is counterclockwise when viewed from above (+Y looking down).  The robot's
 * forward direction at angle θ is (sin θ, 0, cos θ) in world space.
 *
 * Key invariant:
 *   • turnLeft  INCREASES rotation  → counterclockwise → robot's own left
 *   • turnRight DECREASES rotation  → clockwise        → robot's own right
 *
 * This is verified by checking that after a quarter-turn right from the
 * initial south-facing position (+Z), the forward vector points west (−X),
 * which is the correct "first right turn from south" direction.
 */

import {
  moveForward,
  moveBackward,
  turnLeft,
  turnRight,
  DEFAULT_MOVE_STEP,
  DEFAULT_TURN_STEP,
} from '@/sim/motionSystem';
import type { RobotState } from '@/sim/robotState';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRobot(overrides?: Partial<RobotState>): RobotState {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    isMoving: false,
    isRunningQueue: false,
    isPaused: false,
    health: 'ok',
    sensors: { frontDistance: 5, leftObstacle: false, rightObstacle: false, targetDistance: 99 },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// moveForward / moveBackward
// ---------------------------------------------------------------------------

describe('moveForward', () => {
  it('moves along +Z when rotation is 0 (facing south)', () => {
    const robot = makeRobot({ rotation: 0 });
    const result = moveForward(robot);
    expect(result.position!.x).toBeCloseTo(0);
    expect(result.position!.z).toBeCloseTo(DEFAULT_MOVE_STEP);
  });

  it('moves along +X when robot faces east (rotation = −π/2)', () => {
    // After one right turn from south (+Z), the robot faces east (−X is right, +X is left…
    // but a full quarter-turn RIGHT gives rotation = −π/2 → forward = (−1, 0, 0) = west).
    // Actually facing east means rotation = +π/2 (CCW quarter-turn = left turn from south).
    const robot = makeRobot({ rotation: Math.PI / 2 });
    const result = moveForward(robot);
    expect(result.position!.x).toBeCloseTo(DEFAULT_MOVE_STEP);
    expect(result.position!.z).toBeCloseTo(0);
  });

  it('moves in the opposite direction from moveBackward', () => {
    const robot = makeRobot({ rotation: Math.PI / 6 });
    const fwd = moveForward(robot);
    const bwd = moveBackward(robot);
    expect(fwd.position!.x).toBeCloseTo(-bwd.position!.x);
    expect(fwd.position!.z).toBeCloseTo(-bwd.position!.z);
  });

  it('respects custom step size', () => {
    const robot = makeRobot({ rotation: 0 });
    const result = moveForward(robot, 2.0);
    expect(result.position!.z).toBeCloseTo(2.0);
  });
});

// ---------------------------------------------------------------------------
// turnLeft / turnRight — direction correctness
// ---------------------------------------------------------------------------

describe('turnLeft', () => {
  it('increases rotation (counterclockwise = robot\'s own left)', () => {
    const robot = makeRobot({ rotation: 0 });
    const result = turnLeft(robot);
    expect(result.rotation!).toBeGreaterThan(0);
  });

  it('increases rotation by DEFAULT_TURN_STEP', () => {
    const robot = makeRobot({ rotation: 0 });
    const result = turnLeft(robot);
    expect(result.rotation!).toBeCloseTo(DEFAULT_TURN_STEP);
  });

  it('after a quarter-turn left from south, robot faces east (+X direction)', () => {
    // Facing south (+Z), turning left (CCW) should face east (+X).
    // In standard compass: face south → turn left → face east.
    const robot = makeRobot({ rotation: 0 });
    const result = turnLeft(robot, Math.PI / 2);
    const newRot = result.rotation!;
    // Forward vector at newRot: (sin(newRot), 0, cos(newRot))
    expect(Math.sin(newRot)).toBeCloseTo(1);   // +X component
    expect(Math.cos(newRot)).toBeCloseTo(0);   // Z component ≈ 0
  });

  it('accumulates multiple left turns', () => {
    let robot = makeRobot({ rotation: 0 });
    robot = { ...robot, ...turnLeft(robot) } as RobotState;
    robot = { ...robot, ...turnLeft(robot) } as RobotState;
    expect(robot.rotation).toBeCloseTo(2 * DEFAULT_TURN_STEP);
  });
});

describe('turnRight', () => {
  it('decreases rotation (clockwise = robot\'s own right)', () => {
    const robot = makeRobot({ rotation: 0 });
    const result = turnRight(robot);
    expect(result.rotation!).toBeLessThan(0);
  });

  it('decreases rotation by DEFAULT_TURN_STEP', () => {
    const robot = makeRobot({ rotation: 0 });
    const result = turnRight(robot);
    expect(result.rotation!).toBeCloseTo(-DEFAULT_TURN_STEP);
  });

  it('after a quarter-turn right from south, robot faces west (−X direction)', () => {
    // Facing south (+Z), turning right (CW) should face west (−X).
    // In standard compass: face south → turn right → face west.
    const robot = makeRobot({ rotation: 0 });
    const result = turnRight(robot, Math.PI / 2);
    const newRot = result.rotation!;
    // Forward vector at newRot: (sin(newRot), 0, cos(newRot))
    expect(Math.sin(newRot)).toBeCloseTo(-1);  // −X component (west)
    expect(Math.cos(newRot)).toBeCloseTo(0);
  });

  it('turnLeft and turnRight are exact opposites', () => {
    const robot = makeRobot({ rotation: 1.0 });
    const left  = turnLeft(robot, DEFAULT_TURN_STEP);
    const right = turnRight(robot, DEFAULT_TURN_STEP);
    expect(left.rotation! + right.rotation!).toBeCloseTo(2 * robot.rotation);
  });
});

// ---------------------------------------------------------------------------
// Movement consistency: forward direction matches rotation
// ---------------------------------------------------------------------------

describe('movement direction consistency', () => {
  it('after turnRight, moveForward moves robot in direction rotated clockwise', () => {
    let robot = makeRobot({ rotation: 0 });
    // Turn right 90° (CW): facing south (+Z) → west (−X)
    const turned = turnRight(robot, Math.PI / 2);
    robot = { ...robot, ...turned } as RobotState;
    const moved = moveForward(robot);
    // Should move toward −X (west)
    expect(moved.position!.x).toBeLessThan(0);
    expect(moved.position!.z).toBeCloseTo(0);
  });

  it('after turnLeft, moveForward moves robot in direction rotated counterclockwise', () => {
    let robot = makeRobot({ rotation: 0 });
    // Turn left 90° (CCW): facing south (+Z) → east (+X)
    const turned = turnLeft(robot, Math.PI / 2);
    robot = { ...robot, ...turned } as RobotState;
    const moved = moveForward(robot);
    // Should move toward +X (east)
    expect(moved.position!.x).toBeGreaterThan(0);
    expect(moved.position!.z).toBeCloseTo(0);
  });
});
