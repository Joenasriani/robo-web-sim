'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulatorStore } from '@/sim/robotController';

function Robot() {
  const meshRef = useRef<THREE.Group>(null);
  const robot = useSimulatorStore((s) => s.robot);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x = robot.position.x;
    meshRef.current.position.y = robot.position.y;
    meshRef.current.position.z = robot.position.z;
    meshRef.current.rotation.y = robot.rotation;
  });

  const bodyColor = robot.health === 'hit_obstacle' ? '#ef4444' : robot.health === 'reached_target' ? '#22c55e' : '#3b82f6';

  return (
    <group ref={meshRef}>
      {/* Body */}
      <Box args={[0.5, 0.4, 0.6]} castShadow>
        <meshStandardMaterial color={bodyColor} />
      </Box>
      {/* Head indicator (direction arrow) */}
      <Box args={[0.15, 0.15, 0.25]} position={[0, 0.1, -0.35]} castShadow>
        <meshStandardMaterial color="#facc15" />
      </Box>
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

function Obstacles() {
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
}

function Targets() {
  const arena = useSimulatorStore((s) => s.arena);
  return (
    <>
      {arena.targets.map((target) => (
        <group key={target.id} position={target.position}>
          <Cylinder args={[target.radius, target.radius, 0.05, 32]} receiveShadow>
            <meshStandardMaterial color={target.color} transparent opacity={0.8} />
          </Cylinder>
        </group>
      ))}
    </>
  );
}

function Walls({ size }: { size: number }) {
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
}

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

      <OrbitControls makeDefault minPolarAngle={0.1} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
