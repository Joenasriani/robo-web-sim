/**
 * Model Library — curated 3D model definitions for the free-play arena.
 *
 * v2 strategy: built-in primitives (renderType: 'builtin') are preserved and a
 * local GLB asset pipeline (renderType: 'glb') is introduced alongside them.
 *
 * Rules:
 *   - No live third-party API dependencies.
 *   - All assets committed locally under /public/models/.
 *   - Permissive licensing only (CC0, MIT, CC-BY 4.0 with attribution).
 *   - Source metadata preserved for every entry.
 *   - Do not mutate lesson content.
 */

export type ModelCategory = 'obstacle' | 'prop' | 'target' | 'environment' | 'robot';

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
   * 'builtin' — rendered as a Three.js box primitive using placementDefaults.
   * 'glb'     — loaded via @react-three/drei useGLTF from a local glbUrl path.
   */
  renderType: 'builtin' | 'glb';

  /**
   * Emoji or short text used as a thumbnail placeholder in the card header.
   * Shown whenever previewImage is absent or fails to load.
   */
  thumbnail: string;

  /**
   * Optional path to a real preview image (relative to /public/).
   * e.g. '/model-previews/crate-box.svg'
   * When present the model card shows the image instead of the emoji.
   */
  previewImage?: string;

  /**
   * Path to the local GLB/glTF file served from /public/.
   * Required when renderType is 'glb'. Ignored for 'builtin' entries.
   * e.g. '/models/crate-box.glb'
   */
  glbUrl?: string;

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
// Curated model registry
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
  {
    id: 'ml-glb-crate',
    name: 'Crate (GLB)',
    category: 'obstacle',
    description: 'A solid wooden storage crate with a real 3D mesh.',
    source: 'Procedural geometry — robo-web-sim',
    creator: 'robo-web-sim contributors',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    renderType: 'glb',
    thumbnail: '📦',
    previewImage: '/model-previews/crate-box.svg',
    glbUrl: '/models/crate-box.glb',
    placementDefaults: { size: [1, 1, 1], color: '#a16a30' },
  },
  {
    id: 'ml-glb-barrel',
    name: 'Barrel (GLB)',
    category: 'obstacle',
    description: 'A steel drum barrel with cylindrical mesh geometry.',
    source: 'Procedural geometry — robo-web-sim',
    creator: 'robo-web-sim contributors',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    renderType: 'glb',
    thumbnail: '🛢️',
    previewImage: '/model-previews/barrel.svg',
    glbUrl: '/models/barrel.glb',
    placementDefaults: { size: [0.8, 1.2, 0.8], color: '#2563eb' },
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
  {
    id: 'ml-glb-cone',
    name: 'Traffic Cone (GLB)',
    category: 'prop',
    description: 'An orange traffic cone with a real cone-shaped 3D mesh.',
    source: 'Procedural geometry — robo-web-sim',
    creator: 'robo-web-sim contributors',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    renderType: 'glb',
    thumbnail: '🚧',
    previewImage: '/model-previews/traffic-cone.svg',
    glbUrl: '/models/traffic-cone.glb',
    placementDefaults: { size: [0.4, 0.8, 0.4], color: '#f97316' },
  },

  // ── Robots ────────────────────────────────────────────────────────────────
  {
    id: 'ml-glb-robot-scout',
    name: 'Scout Robot (GLB)',
    category: 'robot',
    description: 'A simple low-poly scout robot with body, head, arms, and wheels.',
    source: 'Procedural geometry — robo-web-sim',
    creator: 'robo-web-sim contributors',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    renderType: 'glb',
    thumbnail: 'R',
    previewImage: '/model-previews/robot-scout.svg',
    glbUrl: '/models/robot-scout.glb',
    placementDefaults: { size: [0.7, 1.2, 0.7], color: '#64748b' },
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
  { id: 'robot',       label: 'Robots' },
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
