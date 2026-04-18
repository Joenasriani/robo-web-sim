'use client';

import { useRef, useMemo, Suspense, Component, ReactNode, useLayoutEffect, useState } from 'react';
import { Canvas, ThreeEvent, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder, Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulatorStore } from '@/sim/robotController';
import { Obstacle } from '@/sim/arenaConfig';
import { INITIAL_ROBOT_STATE } from '@/sim/robotState';

// ---------------------------------------------------------------------------
// Color palette helpers — derived from the arena's floorColor so every
// lesson/scenario uses a visually consistent palette automatically.
// ---------------------------------------------------------------------------

/** Scale each RGB channel toward black by `factor` (0 = black, 1 = original). */
function darkenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const scaleChannel = (n: number) => Math.round(Math.max(0, Math.min(255, n * factor))).toString(16).padStart(2, '0');
  return `#${scaleChannel(r)}${scaleChannel(g)}${scaleChannel(b)}`;
}

/** Blend each RGB channel toward white by `factor` (0 = original, 1 = white). */
function lightenHex(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const blendChannel = (n: number) => Math.round(Math.min(255, n + (255 - n) * factor)).toString(16).padStart(2, '0');
  return `#${blendChannel(r)}${blendChannel(g)}${blendChannel(b)}`;
}

// Derived palette factors — tuned so the background/grid always look good against floorColor
const BG_DARKEN_FACTOR           = 0.20; // dark backdrop: ~20 % of floor brightness
const GRID_CELL_DARKEN_FACTOR    = 0.40; // minor grid lines: ~40 % of floor brightness for clear contrast
const GRID_SECTION_LIGHTEN_FACTOR = 0.70; // major grid lines blend 70 % toward white for strong legibility
const FLOOR_CLEARANCE = 0.01;

/** Compute the Y offset needed to rest a mesh on the floor with a tiny clearance. */
export function computeGroundedYOffset(object: THREE.Object3D): number {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return FLOOR_CLEARANCE;
  const offset = -box.min.y + FLOOR_CLEARANCE;
  return Number.isFinite(offset) ? offset : FLOOR_CLEARANCE;
}


/** React error boundary that catches GLB load failures and renders a fallback. */
class GlbErrorBoundary extends Component<
  { fallback: ReactNode; onError: (msg: string) => void; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; onError: (msg: string) => void; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    this.props.onError(`⚠️ GLB load failed: ${error.message}`);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function GlbObstacleInner({
  obs,
  onSelect,
}: {
  obs: Obstacle;
  onSelect?: () => void;
}) {
  const { scene } = useGLTF(obs.glbUrl!);
  // Clone the scene so multiple instances don't share the same object
  const clone = useMemo(() => scene.clone(true), [scene]);
  return (
    <primitive
      object={clone}
      scale={obs.size}
      onClick={onSelect ? (e: THREE.Event) => { (e as unknown as { stopPropagation: () => void }).stopPropagation(); onSelect(); } : undefined}
    />
  );
}

/** Box fallback shown while a GLB loads or if it fails to load. */
function GlbFallbackBox({ obs, isSelected }: { obs: Obstacle; isSelected: boolean }) {
  return (
    <Box
      args={obs.size as [number, number, number]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial color={isSelected ? '#fbbf24' : obs.color} wireframe={false} />
    </Box>
  );
}

function Robot() {
  const meshRef = useRef<THREE.Group>(null);
  const robotModelRef = useRef<THREE.Group>(null);
  const robot = useSimulatorStore((s) => s.robot);
  const [robotYOffset, setRobotYOffset] = useState(FLOOR_CLEARANCE);

  useLayoutEffect(() => {
    if (!robotModelRef.current) return;
    robotModelRef.current.updateMatrixWorld(true);
    setRobotYOffset(computeGroundedYOffset(robotModelRef.current));
  }, []);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.x = robot.position.x;
    meshRef.current.position.y = robot.position.y - INITIAL_ROBOT_STATE.position.y + robotYOffset;
    meshRef.current.position.z = robot.position.z;
    meshRef.current.rotation.y = robot.rotation;
  });

  const bodyColor = robot.health === 'hit_obstacle' ? '#ef4444' : robot.health === 'reached_target' ? '#22c55e' : '#1d6ff4';

  return (
    <group ref={meshRef}>
      <group ref={robotModelRef}>
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
    </group>
  );
}

function GroundedObstacleGroup({
  obs,
  children,
}: {
  obs: Obstacle;
  children: ReactNode;
}) {
  const contentRef = useRef<THREE.Group>(null);
  const [yOffset, setYOffset] = useState(FLOOR_CLEARANCE);
  const baseY = obs.position[1] - obs.size[1] / 2;

  useLayoutEffect(() => {
    if (!contentRef.current) return;
    contentRef.current.updateMatrixWorld(true);
    setYOffset(computeGroundedYOffset(contentRef.current));
  }, [obs.glbUrl, obs.size]);

  return (
    <group position={[obs.position[0], baseY + yOffset, obs.position[2]]} rotation={[0, obs.rotation ?? 0, 0]}>
      <group ref={contentRef}>{children}</group>
    </group>
  );
}

function Obstacles() {
  const arena              = useSimulatorStore((s) => s.arena);
  const isEditMode         = useSimulatorStore((s) => s.isEditMode);
  const placementTool      = useSimulatorStore((s) => s.placementTool);
  const selectedEditObject = useSimulatorStore((s) => s.selectedEditObject);
  const selectEditObject   = useSimulatorStore((s) => s.selectEditObject);
  const appendEvent        = useSimulatorStore((s) => s.appendEvent);

  return (
    <>
      {arena.obstacles.map((obs) => {
        const isSelected =
          isEditMode && selectedEditObject?.type === 'obstacle' && selectedEditObject.id === obs.id;
        const onSelect = isEditMode && !placementTool
          ? () => selectEditObject('obstacle', obs.id)
          : undefined;

        if (obs.glbUrl) {
          // GLB model: render inside ErrorBoundary > Suspense with a box fallback
          const fallback = <GlbFallbackBox obs={obs} isSelected={isSelected} />;
          return (
            <GroundedObstacleGroup key={obs.id} obs={obs}>
              <GlbErrorBoundary
                fallback={fallback}
                onError={(msg) => appendEvent(msg, 'warning')}
              >
                <Suspense fallback={fallback}>
                  <GlbObstacleInner
                    obs={obs}
                    onSelect={onSelect}
                  />
                </Suspense>
              </GlbErrorBoundary>
              {isSelected && (
                <Box
                  args={[(obs.size[0] + 0.12) as number, (obs.size[1] + 0.12) as number, (obs.size[2] + 0.12) as number]}
                >
                  <meshStandardMaterial color="#fbbf24" transparent opacity={0.25} wireframe />
                </Box>
              )}
            </GroundedObstacleGroup>
          );
        }

        // Built-in box primitive (default)
        return (
          <GroundedObstacleGroup key={obs.id} obs={obs}>
            <Box
              args={obs.size as [number, number, number]}
              castShadow
              receiveShadow
              onClick={isEditMode && !placementTool ? (e) => { e.stopPropagation(); selectEditObject('obstacle', obs.id); } : undefined}
            >
              <meshStandardMaterial color={isSelected ? '#fbbf24' : obs.color} />
            </Box>
            {/* Selection outline */}
            {isSelected && (
              <Box
                args={[(obs.size[0] + 0.12) as number, (obs.size[1] + 0.12) as number, (obs.size[2] + 0.12) as number]}
              >
                <meshStandardMaterial color="#fbbf24" transparent opacity={0.25} wireframe />
              </Box>
            )}
          </GroundedObstacleGroup>
        );
      })}
    </>
  );
}


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

function Targets() {
  const arena              = useSimulatorStore((s) => s.arena);
  const health             = useSimulatorStore((s) => s.robot.health);
  const isEditMode         = useSimulatorStore((s) => s.isEditMode);
  const placementTool      = useSimulatorStore((s) => s.placementTool);
  const selectedEditObject = useSimulatorStore((s) => s.selectedEditObject);
  const selectEditObject   = useSimulatorStore((s) => s.selectEditObject);

  return (
    <>
      {arena.targets.map((target) => {
        const isSelected =
          isEditMode && selectedEditObject?.type === 'target' && selectedEditObject.id === target.id;
        return (
          <group
            key={target.id}
            position={target.position}
            onClick={isEditMode && !placementTool ? (e) => { e.stopPropagation(); selectEditObject('target', target.id); } : undefined}
          >
            <Cylinder args={[target.radius, target.radius, 0.05, 32]} receiveShadow>
              <meshStandardMaterial
                color={isSelected ? '#fbbf24' : health === 'reached_target' ? '#86efac' : target.color}
                transparent
                opacity={0.8}
              />
            </Cylinder>
            <PulsingRing radius={target.radius} color={isSelected ? '#fbbf24' : target.color} />
            {/* Selection ring */}
            {isSelected && (
              <Cylinder
                args={[target.radius + 0.15, target.radius + 0.15, 0.08, 32]}
                receiveShadow
              >
                <meshStandardMaterial color="#fbbf24" transparent opacity={0.3} wireframe />
              </Cylinder>
            )}
          </group>
        );
      })}
    </>
  );
}

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

  // Positive Y rotation in Three.js is counterclockwise (left) from above.
  // leftAngle adds π/4 (CCW) → forward-left; rightAngle subtracts π/4 (CW) → forward-right.
  const leftAngle = rot + Math.PI / 4;
  const leftEnd: [number, number, number] = [
    x + Math.sin(leftAngle) * SIDE_LEN,
    y,
    z + Math.cos(leftAngle) * SIDE_LEN,
  ];

  const rightAngle = rot - Math.PI / 4;
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
      : '#00e676';
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

function Walls({ size, color }: { size: number; color: string }) {
  const half = size / 2;
  const wallHeight = 0.5;
  const wallThickness = 0.2;
  return (
    <>
      {/* North wall */}
      <Box args={[size + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, -half]} receiveShadow castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* South wall */}
      <Box args={[size + wallThickness, wallHeight, wallThickness]} position={[0, wallHeight / 2, half]} receiveShadow castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* East wall */}
      <Box args={[wallThickness, wallHeight, size]} position={[half, wallHeight / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={color} />
      </Box>
      {/* West wall */}
      <Box args={[wallThickness, wallHeight, size]} position={[-half, wallHeight / 2, 0]} receiveShadow castShadow>
        <meshStandardMaterial color={color} />
      </Box>
    </>
  );
}

function PlacementGhost({
  position,
  size,
  color,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}) {
  return (
    <Box args={size} position={position}>
      <meshStandardMaterial color={color} transparent opacity={0.35} />
    </Box>
  );
}

export default function Arena3D() {
  const isEditMode         = useSimulatorStore((s) => s.isEditMode);
  const placementTool      = useSimulatorStore((s) => s.placementTool);
  const placementPreviewPosition = useSimulatorStore((s) => s.placementPreviewPosition);
  const deselectEditObject = useSimulatorStore((s) => s.deselectEditObject);
  const setPlacementPreviewPosition = useSimulatorStore((s) => s.setPlacementPreviewPosition);
  const placeSelectedModelAt = useSimulatorStore((s) => s.placeSelectedModelAt);
  const arena              = useSimulatorStore((s) => s.arena);

  const { size, wallColor, floorColor } = arena;

  // Derive palette from floorColor so all lessons/scenarios look consistent
  const bgColor          = darkenHex(floorColor, BG_DARKEN_FACTOR);
  const gridCellColor    = darkenHex(floorColor, GRID_CELL_DARKEN_FACTOR);
  const gridSectionColor = lightenHex(floorColor, GRID_SECTION_LIGHTEN_FACTOR);

  const clampFloorPosition = (point: THREE.Vector3): [number, number, number] => {
    const half = size / 2 - 0.6;
    const snap = (value: number) => Math.round(value);
    const x = Math.max(-half, Math.min(half, snap(point.x)));
    const z = Math.max(-half, Math.min(half, snap(point.z)));
    const yOffset = placementTool ? placementTool.size[1] / 2 + FLOOR_CLEARANCE : 0.5 + FLOOR_CLEARANCE;
    return [x, yOffset, z];
  };

  const handleFloorPointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isEditMode || !placementTool) return;
    event.stopPropagation();
    setPlacementPreviewPosition(clampFloorPosition(event.point));
  };

  const handleFloorPointerLeave = () => {
    if (!isEditMode || !placementTool) return;
    setPlacementPreviewPosition(null);
  };

  const handleFloorClick = (event: ThreeEvent<MouseEvent>) => {
    if (!isEditMode) return;
    if (!placementTool) {
      deselectEditObject();
      return;
    }
    event.stopPropagation();
    placeSelectedModelAt(clampFloorPosition(event.point));
  };

  return (
    <Canvas
      shadows
      camera={{ position: [8, 8, 8], fov: 50 }}
      style={{
        background: bgColor,
        cursor: isEditMode && placementTool ? 'crosshair' : isEditMode ? 'default' : 'grab',
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

      {/* Floor — click on empty floor to deselect when in edit mode */}
      <Grid
        args={[size, size]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={gridCellColor}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={gridSectionColor}
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
      />
      <Box
        args={[size, 0.1, size]}
        position={[0, -0.05, 0]}
        receiveShadow
        onPointerMove={isEditMode && placementTool ? handleFloorPointerMove : undefined}
        onPointerOut={isEditMode && placementTool ? handleFloorPointerLeave : undefined}
        onClick={isEditMode ? handleFloorClick : undefined}
      >
        <meshStandardMaterial color={floorColor} />
      </Box>

      <Walls size={size} color={wallColor} />
      <Obstacles />
      <Targets />
      {isEditMode && placementTool && placementPreviewPosition && (
        <PlacementGhost
          position={placementPreviewPosition}
          size={placementTool.size}
          color={placementTool.color}
        />
      )}
      <Robot />
      <SensorRays />

      <OrbitControls makeDefault minPolarAngle={0.1} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}
