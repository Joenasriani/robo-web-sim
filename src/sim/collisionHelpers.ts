import { RobotState, SensorData } from './robotState';
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

// Ray-AABB intersection in 2D (XZ plane), returns distance or null
function rayToBoxDistance(
  ox: number, oz: number,
  dx: number, dz: number,
  obs: Obstacle
): number | null {
  const [bx, , bz] = obs.position;
  const [sw, , sd] = obs.size;
  const minX = bx - sw / 2, maxX = bx + sw / 2;
  const minZ = bz - sd / 2, maxZ = bz + sd / 2;
  let tmin = -Infinity, tmax = Infinity;
  if (Math.abs(dx) > 1e-9) {
    const t1 = (minX - ox) / dx, t2 = (maxX - ox) / dx;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  } else if (ox < minX || ox > maxX) return null;
  if (Math.abs(dz) > 1e-9) {
    const t1 = (minZ - oz) / dz, t2 = (maxZ - oz) / dz;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  } else if (oz < minZ || oz > maxZ) return null;
  if (tmax < 0 || tmin > tmax) return null;
  return tmin > 0 ? tmin : tmax > 0 ? tmax : null;
}

function rayToWallDistance(
  ox: number, oz: number,
  dx: number, dz: number,
  arenaSize: number
): number {
  const half = arenaSize / 2;
  let minDist = Infinity;
  if (dx > 1e-9)  { const t = (half - ox) / dx;  if (t > 0) minDist = Math.min(minDist, t); }
  if (dx < -1e-9) { const t = (-half - ox) / dx; if (t > 0) minDist = Math.min(minDist, t); }
  if (dz > 1e-9)  { const t = (half - oz) / dz;  if (t > 0) minDist = Math.min(minDist, t); }
  if (dz < -1e-9) { const t = (-half - oz) / dz; if (t > 0) minDist = Math.min(minDist, t); }
  return minDist;
}

export function computeSensors(robot: RobotState, arena: ArenaConfig): SensorData {
  const FRONT_RANGE = 5.0;
  const SIDE_RANGE = 1.2;
  const { x: ox, z: oz } = robot.position;
  const rot = robot.rotation;

  const fdx = Math.sin(rot), fdz = Math.cos(rot);
  let frontDistance = Math.min(FRONT_RANGE, rayToWallDistance(ox, oz, fdx, fdz, arena.size));
  for (const obs of arena.obstacles) {
    const d = rayToBoxDistance(ox, oz, fdx, fdz, obs);
    if (d !== null && d < frontDistance) frontDistance = d;
  }

  const leftAngle = rot - Math.PI / 4;
  const ldx = Math.sin(leftAngle), ldz = Math.cos(leftAngle);
  let leftObstacle = rayToWallDistance(ox, oz, ldx, ldz, arena.size) < SIDE_RANGE;
  if (!leftObstacle) {
    for (const obs of arena.obstacles) {
      const d = rayToBoxDistance(ox, oz, ldx, ldz, obs);
      if (d !== null && d < SIDE_RANGE) { leftObstacle = true; break; }
    }
  }

  const rightAngle = rot + Math.PI / 4;
  const rdx = Math.sin(rightAngle), rdz = Math.cos(rightAngle);
  let rightObstacle = rayToWallDistance(ox, oz, rdx, rdz, arena.size) < SIDE_RANGE;
  if (!rightObstacle) {
    for (const obs of arena.obstacles) {
      const d = rayToBoxDistance(ox, oz, rdx, rdz, obs);
      if (d !== null && d < SIDE_RANGE) { rightObstacle = true; break; }
    }
  }

  let targetDistance = 99;
  for (const t of arena.targets) {
    const [tx, , tz] = t.position;
    const dist = Math.sqrt((ox - tx) ** 2 + (oz - tz) ** 2);
    if (dist < targetDistance) targetDistance = dist;
  }

  return { frontDistance, leftObstacle, rightObstacle, targetDistance };
}
