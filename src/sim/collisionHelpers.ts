import { RobotState } from './robotState';
import { ArenaConfig, Obstacle, Target } from './arenaConfig';

export function checkObstacleCollision(robot: RobotState, obstacle: Obstacle): boolean {
  const [ox, , oz] = obstacle.position;
  const [sw, , sd] = obstacle.size;
  const dx = Math.abs(robot.position.x - ox);
  const dz = Math.abs(robot.position.z - oz);
  return dx < (sw / 2 + 0.3) && dz < (sd / 2 + 0.3);
}

export function checkTargetReached(robot: RobotState, target: Target): boolean {
  const [tx, , tz] = target.position;
  const dx = robot.position.x - tx;
  const dz = robot.position.z - tz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  return dist < target.radius + 0.3;
}

export function checkArenaCollision(robot: RobotState, arenaSize: number): boolean {
  const half = arenaSize / 2 - 0.3;
  return (
    robot.position.x > half ||
    robot.position.x < -half ||
    robot.position.z > half ||
    robot.position.z < -half
  );
}

export function checkCollisions(robot: RobotState, arena: ArenaConfig): 'ok' | 'hit_obstacle' | 'reached_target' {
  for (const target of arena.targets) {
    if (checkTargetReached(robot, target)) return 'reached_target';
  }
  for (const obstacle of arena.obstacles) {
    if (checkObstacleCollision(robot, obstacle)) return 'hit_obstacle';
  }
  if (checkArenaCollision(robot, arena.size)) return 'hit_obstacle';
  return 'ok';
}
