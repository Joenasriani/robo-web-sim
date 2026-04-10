export interface Obstacle {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  /** The library model id this obstacle was placed from, if any. */
  modelId?: string;
  /** Local GLB path (e.g. '/models/crate-box.glb') for renderType:'glb' obstacles. */
  glbUrl?: string;
}

export interface Target {
  id: string;
  position: [number, number, number];
  radius: number;
  color: string;
}

export interface ArenaConfig {
  size: number;
  obstacles: Obstacle[];
  targets: Target[];
  wallColor: string;
  floorColor: string;
}

/** Partial override applied on top of DEFAULT_ARENA for a specific lesson or scenario. */
export interface ArenaOverrides {
  size?: number;
  obstacles?: Obstacle[];
  targets?: Target[];
  wallColor?: string;
  floorColor?: string;
}

export const DEFAULT_ARENA: ArenaConfig = {
  size: 10,
  obstacles: [
    { id: 'obs1', position: [2, 0.5, 1], size: [1, 1, 1], color: '#ef4444' },
    { id: 'obs2', position: [-2, 0.5, -2], size: [1, 1, 1], color: '#f97316' },
  ],
  targets: [
    { id: 'target1', position: [3, 0.05, 3], radius: 0.5, color: '#22c55e' },
  ],
  wallColor: '#94a3b8',
  floorColor: '#1e293b',
};
