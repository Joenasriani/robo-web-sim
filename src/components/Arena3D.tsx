'use client';

import { useRef, memo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulatorStore } from '@/sim/robotController';

// Exponential-decay lerp factor — keeps animation speed framerate-independent.
const LERP_SPEED = 10;

function Robot() {
  const meshRef = useRef<THREE.Group>(null);
  const robot = useSimulatorStore((s) => s.robot);

  // targetRef mirrors the store state and is updated on every render so the
  // useFrame callback always has access to the latest target without needing
  // to be recreated (avoids stale-closure issues between re-renders).
  const targetRef = useRef({ x: robot.position.x, y: robot.position.y, z: robot.position.z, rot: robot.rotation });
  targetRef.current = { x: robot.position.x, y: robot.position.y, z: robot.position.z, rot: robot.rotation };

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const { x, y, z, rot } = targetRef.current;
    const alpha = 1 - Math.exp(-LERP_SPEED * delta);

    // Smooth position interpolation
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, x, alpha);
    meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, y, alpha);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, z, alpha);

    // Short-path rotation lerp — normalise difference to [-π, π] so turns
    // always go the short way and feel visually clear.
    const rotDiff = Math.atan2(Math.sin(rot - meshRef.current.rotation.y), Math.cos(rot - meshRef.current.rotation.y));
    meshRef.current.rotation.y += rotDiff * alpha;
  });

  const bodyColor = robot.health === 'hit_obstacle' ? '#ef4444' : robot.health === 'reached_target' ? '#22c55e' : '#3b82f6';

  return (
    <group ref={meshRef}>
      {/* Body */}
      <Box args={[0.5, 0.4, 0.6]} castShadow>
        <meshStandardMaterial color={bodyColor} />
      </Box>
      {/* Forward direction cone */}
      <mesh position={[0, 0.1, 0.4]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.07, 0.2, 8]} />
        <meshStandardMaterial color="#facc15" />
      </mesh>
      {/* Wheels */}
      <Cylinder args={[0.12, 0.12, 0.1, 16]} position={[-0.3, -0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#1e293b" />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.1, 16]} position={[0.3, -0.2, 0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#1e293b" />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.1, 16]} position={[-0.3, -0.2, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#1e293b" />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.1, 16]} position={[0.3, -0.2, -0.2]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <meshStandardMaterial color="#1e293b" />
      </Cylinder>
    </group>
  );
}

// Obstacles only change on scenario/lesson switch, not during robot movement.
// Wrapping in memo avoids redundant reconciliation when parent canvas rerenders.
const Obstacles = memo(function Obstacles() {
  const arena = useSimulatorStore((s) => s.arena);
  return (
    <>
      {arena.obstacles.map((obs) => (
        <Box key={obs.id} args={obs.size as [number, number, number]} position={obs.position} castShadow receiveShadow>
          <meshStandardMaterial color={obs.color} />
        </Box>
      ))}
    </>
  );
});


function PulsingRing({ radius, color }: { radius: number; color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    elapsed.current += delta;
    const t = elapsed.current * 2;
    meshRef.current.scale.setScalar(1 + 0.1 * Math.sin(t));
    (meshRef.current.material as THREE.MeshStandardMaterial).opacity = 0.4 + 0.3 * Math.sin(t);
  });
  return (
    <mesh ref={meshRef} receiveShadow>
      <cylinderGeometry args={[radius + 0.15, radius + 0.15, 0.02, 32]} />
      <meshStandardMaterial color={color} transparent opacity={0.5} />
    </mesh>
  );
}

// Targets re-render when the arena layout or robot health changes.
// memo prevents redundant reconciliation from parent canvas re-renders
// while still allowing the internal store subscriptions to trigger updates
// on arena/health changes (which is correct and infrequent).
const Targets = memo(function Targets() {
  const arena = useSimulatorStore((s) => s.arena);
  const health = useSimulatorStore((s) => s.robot.health);
  return (
    <>
      {arena.targets.map((target) => (
        <group key={target.id} position={target.position}>
          <Cylinder args={[target.radius, target.radius, 0.05, 32]} receiveShadow>
            <meshStandardMaterial
              color={health === 'reached_target' ? '#86efac' : target.color}
              transparent
              opacity={0.8}
            />
          </Cylinder>
          <PulsingRing radius={target.radius} color={target.color} />
        </group>
      ))}
    </>
  );
});

function SensorRays() {
  const robot = useSimulatorStore((s) => s.robot);
  const { x, y, z } = robot.position;
  const rot = robot.rotation;
  const sensors = robot.sensors;

  const origin: [number, number, number] = [x, y, z];

  const FRONT_LEN = Math.min(sensors.frontDistance, 3);
  const SIDE_LEN = 1.2;

  const frontEnd: [number, number, number] = [
    x + Math.sin(rot) * FRONT_LEN,
    y,
    z + Math.cos(rot) * FRONT_LEN,
  ];

  const leftAngle = rot - Math.PI / 4;
  const leftEnd: [number, number, number] = [
    x + Math.sin(leftAngle) * SIDE_LEN,
    y,
    z + Math.cos(leftAngle) * SIDE_LEN,
  ];

  const rightAngle = rot + Math.PI / 4;
  const rightEnd: [number, number, number] = [
    x + Math.sin(rightAngle) * SIDE_LEN,
    y,
    z + Math.cos(rightAngle) * SIDE_LEN,
  ];

  const frontColor =
    sensors.frontDistance < 1.5
      ? '#ef4444'
      : sensors.frontDistance < 2.5
      ? '#f97316'
      : '#00ff88';
  const leftColor = sensors.leftObstacle ? '#f97316' : '#facc15';
  const rightColor = sensors.rightObstacle ? '#f97316' : '#facc15';

  return (
    <>
      <Line points={[origin, frontEnd]} color={frontColor} lineWidth={1.5} />
      <Line
        points={[origin, leftEnd]}
        color={leftColor}
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      <Line
        points={[origin, rightEnd]}
        color={rightColor}
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
    </>
  );
}

// Walls are purely static — memo ensures they are never reconciled unless size
// prop changes (it doesn't; it's always 10).
const Walls = memo(function Walls({ size }: { size: number }) {
  const half = size / 2;
  const wallColor = '#334155';
  const wallHeight = 0.5;
  const wallThickness = 0.2;
  return (
    <>
      {/* North wall */}
      <Box args={[size + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, -half]} receiveShadow castShadow>
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* South wall */}
      <Box args={[size + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, half]} receiveShadow castShadow>
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* East wall */}
      <Box args={[wallThickness, wallHeight, size]} position={[half, wallHeight / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={wallColor} />
      </Box>
      {/* West wall */}
      <Box args={[wallThickness, wallHeight, size]} position={[-half, wallHeight / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={wallColor} />
      </Box>
    </>
  );
});

export default function Arena3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 8, 8], fov: 50 }}
      style={{ background: '#0f172a' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

      {/* Floor */}
      <Grid
        args={[10, 10]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1e40af"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      <Box args={[10, 0.1, 10]} position={[0, -0.05, 0]} receiveShadow>
        <meshStandardMaterial color="#0f172a" />
      </Box>

      <Walls size={10} />
      <Obstacles />
      <Targets />
      <Robot />
      <SensorRays />

      <OrbitControls
        makeDefault
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.08}
      />
    </Canvas>
  );
}
