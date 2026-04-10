/**
 * Model Library — curated built-in 3D model definitions for the free-play arena.
 *
 * v1 strategy: all models use `renderType: 'builtin'` (Three.js box primitives).
 * The metadata structure is attribution-ready and extensible to real GLB/glTF
 * assets in a future release.
 *
 * Rules:
 *   - No live third-party API dependencies.
 *   - Permissive licensing only (MIT for built-ins).
 *   - Source metadata preserved for every entry.
 *   - Do not mutate lesson content.
 */

export type ModelCategory = 'obstacle' | 'prop' | 'target' | 'environment';

export interface ModelDefinition {
  /** Stable unique identifier for this model. */
  id: string;
  /** Human-readable display name. */
  name: string;
  /** Broad category used for filtering in the UI. */
  category: ModelCategory;
  /** Short description shown in the model card. */
  description: string;

  // ---------------------------------------------------------------------------
  // Source metadata (attribution-ready)
  // ---------------------------------------------------------------------------
  /** Where this model comes from, e.g. "Built-in" or a URL. */
  source: string;
  /** Author or organisation that created the model. */
  creator: string;
  /** Short license identifier, e.g. "MIT", "CC0", "CC-BY 4.0". */
  license: string;
  /** Optional URL to the full license text. */
  licenseUrl?: string;
  /** Optional URL to the original source page. */
  sourceUrl?: string;

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------
  /**
   * v1: 'builtin' — rendered as a Three.js box primitive using placementDefaults.
   * Future: 'glb' — loaded via @react-three/drei <useGLTF> with a glbUrl field.
   */
  renderType: 'builtin';

  /**
   * Emoji or short text used as a thumbnail placeholder.
   * Real image paths can replace this in a future pass.
   */
  thumbnail: string;

  // ---------------------------------------------------------------------------
  // Placement
  // ---------------------------------------------------------------------------
  /**
   * Default obstacle dimensions and colour applied when placing this model
   * into the free-play arena.
   */
  placementDefaults: {
    size: [number, number, number];
    color: string;
  };
}

// ---------------------------------------------------------------------------
// Curated model registry (v1 — built-in primitives only)
// ---------------------------------------------------------------------------

export const CURATED_MODELS: ModelDefinition[] = [
  // ── Obstacles ─────────────────────────────────────────────────────────────
  {
    id: 'ml-red-crate',
    name: 'Red Crate',
    category: 'obstacle',
    description: 'A classic red storage crate. Solid and easy to spot.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '📦',
    placementDefaults: { size: [1, 1, 1], color: '#ef4444' },
  },
  {
    id: 'ml-blue-barrel',
    name: 'Blue Barrel',
    category: 'obstacle',
    description: 'A stocky blue barrel. A common warehouse obstacle.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🛢️',
    placementDefaults: { size: [0.8, 1.2, 0.8], color: '#3b82f6' },
  },
  {
    id: 'ml-stone-wall',
    name: 'Stone Wall',
    category: 'obstacle',
    description: 'A wide grey wall segment. Use it to create corridors.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🧱',
    placementDefaults: { size: [2.5, 1, 0.4], color: '#94a3b8' },
  },

  // ── Props ─────────────────────────────────────────────────────────────────
  {
    id: 'ml-traffic-cone',
    name: 'Traffic Cone',
    category: 'prop',
    description: 'An orange traffic cone. Mark hazard or caution zones.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🚧',
    placementDefaults: { size: [0.4, 0.8, 0.4], color: '#f97316' },
  },
  {
    id: 'ml-yellow-barrier',
    name: 'Yellow Barrier',
    category: 'prop',
    description: 'A long yellow safety barrier for guiding robot paths.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🚏',
    placementDefaults: { size: [3, 0.8, 0.3], color: '#eab308' },
  },
  {
    id: 'ml-purple-block',
    name: 'Purple Block',
    category: 'prop',
    description: 'A neutral decorative block. Good for marking checkpoints.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🟪',
    placementDefaults: { size: [0.6, 0.6, 0.6], color: '#a855f7' },
  },

  // ── Targets ───────────────────────────────────────────────────────────────
  {
    id: 'ml-green-pad',
    name: 'Green Pad',
    category: 'target',
    description: 'A flat green landing pad. Use as a secondary target marker.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🟢',
    placementDefaults: { size: [1.2, 0.1, 1.2], color: '#22c55e' },
  },
  {
    id: 'ml-gold-marker',
    name: 'Gold Marker',
    category: 'target',
    description: 'A bright gold checkpoint marker. Highly visible from any angle.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '⭐',
    placementDefaults: { size: [0.8, 0.1, 0.8], color: '#f59e0b' },
  },

  // ── Environment ───────────────────────────────────────────────────────────
  {
    id: 'ml-wide-platform',
    name: 'Wide Platform',
    category: 'environment',
    description: 'A broad flat platform that raises an area of the arena floor.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🟫',
    placementDefaults: { size: [3, 0.2, 3], color: '#78716c' },
  },
  {
    id: 'ml-corner-pillar',
    name: 'Corner Pillar',
    category: 'environment',
    description: 'A tall narrow pillar. Great for corners and arena boundaries.',
    source: 'Built-in',
    creator: 'RoboWebSim',
    license: 'MIT',
    renderType: 'builtin',
    thumbnail: '🏛️',
    placementDefaults: { size: [0.4, 2, 0.4], color: '#64748b' },
  },
];

/** All available category values, in display order. */
export const MODEL_CATEGORIES: { id: ModelCategory; label: string }[] = [
  { id: 'obstacle',    label: 'Obstacles' },
  { id: 'prop',        label: 'Props' },
  { id: 'target',      label: 'Targets' },
  { id: 'environment', label: 'Environment' },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** Look up a model by its stable id. Returns undefined for unknown ids. */
export function getModelById(id: string): ModelDefinition | undefined {
  return CURATED_MODELS.find((m) => m.id === id);
}

/** Return all models belonging to a given category. */
export function getModelsByCategory(category: ModelCategory): ModelDefinition[] {
  return CURATED_MODELS.filter((m) => m.category === category);
}
