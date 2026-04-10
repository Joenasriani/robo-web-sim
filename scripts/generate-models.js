/**
 * GLB Generator for robo-web-sim PR #14
 * Generates real GLB files with actual 3D geometry using glTF 2.0 binary format.
 * All geometry is procedurally generated — CC0 1.0 (public domain).
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// GLB binary writer
// ---------------------------------------------------------------------------

/**
 * Build a minimal glTF 2.0 GLB from mesh data.
 * @param {object} gltfJson - The glTF JSON object
 * @param {Buffer} binaryBuffer - Raw binary data for buffer 0
 * @returns {Buffer} Complete GLB file
 */
function buildGLB(gltfJson, binaryBuffer) {
  const jsonStr = JSON.stringify(gltfJson);
  const jsonPad = (4 - (jsonStr.length % 4)) % 4;
  const jsonBytes = Buffer.concat([
    Buffer.from(jsonStr, 'utf8'),
    Buffer.alloc(jsonPad, 0x20),
  ]);

  const binPad = binaryBuffer.length > 0 ? (4 - (binaryBuffer.length % 4)) % 4 : 0;
  const binBytes = Buffer.concat([binaryBuffer, Buffer.alloc(binPad, 0x00)]);

  const totalLen =
    12 +
    8 + jsonBytes.length +
    (binBytes.length > 0 ? 8 + binBytes.length : 0);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // magic "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(totalLen, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBytes.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const parts = [header, jsonChunkHeader, jsonBytes];

  if (binBytes.length > 0) {
    const binChunkHeader = Buffer.alloc(8);
    binChunkHeader.writeUInt32LE(binBytes.length, 0);
    binChunkHeader.writeUInt32LE(0x004e4942, 4); // "BIN\0"
    parts.push(binChunkHeader, binBytes);
  }

  return Buffer.concat(parts);
}

function floatBuf(arr) {
  const buf = Buffer.alloc(arr.length * 4);
  arr.forEach((v, i) => buf.writeFloatLE(v, i * 4));
  return buf;
}

function uint16Buf(arr) {
  const buf = Buffer.alloc(arr.length * 2);
  arr.forEach((v, i) => buf.writeUInt16LE(v, i * 2));
  return buf;
}

function minmax3(arr) {
  let minV = [Infinity, Infinity, Infinity];
  let maxV = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < arr.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      minV[j] = Math.min(minV[j], arr[i + j]);
      maxV[j] = Math.max(maxV[j], arr[i + j]);
    }
  }
  return {
    min: minV.map(v => Math.round(v * 100000) / 100000),
    max: maxV.map(v => Math.round(v * 100000) / 100000),
  };
}

/**
 * Create a complete GLB from positions, normals, indices, and a base color.
 */
function makeGLB(positions, normals, indices, baseColor, name = 'Mesh', metallic = 0.1, roughness = 0.8) {
  const nVerts = positions.length / 3;
  const nIdx   = indices.length;

  const posBuf  = floatBuf(positions);
  const normBuf = floatBuf(normals);
  const idxBuf  = uint16Buf(indices);
  const idxPad  = (4 - (idxBuf.length % 4)) % 4;
  const idxPadded = Buffer.concat([idxBuf, Buffer.alloc(idxPad, 0x00)]);

  const posByteOffset  = 0;
  const normByteOffset = posBuf.length;
  const idxByteOffset  = normByteOffset + normBuf.length;

  const totalBin = posBuf.length + normBuf.length + idxPadded.length;
  const binary   = Buffer.concat([posBuf, normBuf, idxPadded]);

  const { min: posMin, max: posMax } = minmax3(positions);

  const gltf = {
    asset: { version: '2.0', generator: 'robo-web-sim v2 geometry generator' },
    scene: 0,
    scenes: [{ name: 'Scene', nodes: [0] }],
    nodes: [{ mesh: 0, name }],
    meshes: [{
      name,
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
        mode: 4,
      }],
    }],
    materials: [{
      name: 'Material',
      pbrMetallicRoughness: {
        baseColorFactor: baseColor,
        metallicFactor: metallic,
        roughnessFactor: roughness,
      },
      doubleSided: false,
    }],
    accessors: [
      {
        bufferView: 0,
        byteOffset: 0,
        componentType: 5126,
        count: nVerts,
        type: 'VEC3',
        min: posMin,
        max: posMax,
      },
      {
        bufferView: 1,
        byteOffset: 0,
        componentType: 5126,
        count: nVerts,
        type: 'VEC3',
      },
      {
        bufferView: 2,
        byteOffset: 0,
        componentType: 5123,
        count: nIdx,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: posByteOffset,  byteLength: posBuf.length,  target: 34962 },
      { buffer: 0, byteOffset: normByteOffset, byteLength: normBuf.length, target: 34962 },
      { buffer: 0, byteOffset: idxByteOffset,  byteLength: idxBuf.length,  target: 34963 },
    ],
    buffers: [{ byteLength: totalBin }],
  };

  return buildGLB(gltf, binary);
}

// ---------------------------------------------------------------------------
// Geometry builders
// ---------------------------------------------------------------------------

function buildBox() {
  const faces = [
    { n: [0, 0, 1],  v: [[-0.5,-0.5, 0.5],[ 0.5,-0.5, 0.5],[ 0.5, 0.5, 0.5],[-0.5, 0.5, 0.5]] },
    { n: [0, 0,-1],  v: [[ 0.5,-0.5,-0.5],[-0.5,-0.5,-0.5],[-0.5, 0.5,-0.5],[ 0.5, 0.5,-0.5]] },
    { n: [-1, 0, 0], v: [[-0.5,-0.5,-0.5],[-0.5,-0.5, 0.5],[-0.5, 0.5, 0.5],[-0.5, 0.5,-0.5]] },
    { n: [1, 0, 0],  v: [[ 0.5,-0.5, 0.5],[ 0.5,-0.5,-0.5],[ 0.5, 0.5,-0.5],[ 0.5, 0.5, 0.5]] },
    { n: [0, 1, 0],  v: [[-0.5, 0.5, 0.5],[ 0.5, 0.5, 0.5],[ 0.5, 0.5,-0.5],[-0.5, 0.5,-0.5]] },
    { n: [0,-1, 0],  v: [[-0.5,-0.5,-0.5],[ 0.5,-0.5,-0.5],[ 0.5,-0.5, 0.5],[-0.5,-0.5, 0.5]] },
  ];

  const positions = [], normals = [], indices = [];
  let vi = 0;
  for (const face of faces) {
    for (const vp of face.v) { positions.push(...vp); normals.push(...face.n); }
    indices.push(vi, vi+1, vi+2, vi, vi+2, vi+3);
    vi += 4;
  }
  return { positions, normals, indices };
}

function buildCylinder(segments = 16) {
  const positions = [], normals = [], indices = [];
  const r = 0.5, h = 0.5;

  // Side walls
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const nx = Math.cos(theta), nz = Math.sin(theta);
    positions.push(r * nx, -h, r * nz); normals.push(nx, 0, nz);
    positions.push(r * nx,  h, r * nz); normals.push(nx, 0, nz);
  }
  for (let i = 0; i < segments; i++) {
    const b0 = i * 2, t0 = b0 + 1, b1 = b0 + 2, t1 = b0 + 3;
    indices.push(b0, b1, t0, t0, b1, t1);
  }

  // Top cap
  const capBase = (segments + 1) * 2;
  positions.push(0, h, 0); normals.push(0, 1, 0);
  const topRimStart = capBase + 1;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    positions.push(r * Math.cos(theta), h, r * Math.sin(theta)); normals.push(0, 1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(capBase, topRimStart + (i + 1) % segments, topRimStart + i);
  }

  // Bottom cap
  const botCapBase = capBase + 1 + segments;
  positions.push(0, -h, 0); normals.push(0, -1, 0);
  const botRimStart = botCapBase + 1;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    positions.push(r * Math.cos(theta), -h, r * Math.sin(theta)); normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(botCapBase, botRimStart + i, botRimStart + (i + 1) % segments);
  }

  return { positions, normals, indices };
}

function buildCone(segments = 16) {
  const positions = [], normals = [], indices = [];
  const r = 0.5, h = 1.0;
  const slope = Math.atan(r / h);
  const ny = Math.sin(slope), nr = Math.cos(slope);

  // Lateral surface — one triangle per segment with face normals
  for (let i = 0; i < segments; i++) {
    const theta0 = (i / segments) * Math.PI * 2;
    const theta1 = ((i + 1) / segments) * Math.PI * 2;
    const thetaMid = (theta0 + theta1) / 2;
    const fnx = Math.cos(thetaMid) * nr, fnz = Math.sin(thetaMid) * nr;

    const v0 = i * 3;
    positions.push(0, h, 0);                             normals.push(fnx, ny, fnz);
    positions.push(r * Math.cos(theta0), 0, r * Math.sin(theta0)); normals.push(fnx, ny, fnz);
    positions.push(r * Math.cos(theta1), 0, r * Math.sin(theta1)); normals.push(fnx, ny, fnz);
    indices.push(v0, v0 + 1, v0 + 2);
  }

  // Base cap
  const baseCenterIdx = segments * 3;
  positions.push(0, 0, 0); normals.push(0, -1, 0);
  const baseRimStart = baseCenterIdx + 1;
  for (let i = 0; i < segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    positions.push(r * Math.cos(theta), 0, r * Math.sin(theta)); normals.push(0, -1, 0);
  }
  for (let i = 0; i < segments; i++) {
    indices.push(baseCenterIdx, baseRimStart + i, baseRimStart + (i + 1) % segments);
  }

  return { positions, normals, indices };
}

/**
 * Merge multiple geometry parts, each with a scale and translate.
 */
function mergeGeometry(parts) {
  const allPositions = [], allNormals = [], allIndices = [];
  let vertexOffset = 0;

  for (const { positions, normals, indices, transform } of parts) {
    const [sx, sy, sz] = transform.scale || [1, 1, 1];
    const [tx, ty, tz] = transform.translate || [0, 0, 0];
    const nVerts = positions.length / 3;

    for (let i = 0; i < positions.length; i += 3) {
      allPositions.push(positions[i] * sx + tx, positions[i+1] * sy + ty, positions[i+2] * sz + tz);
    }
    for (let i = 0; i < normals.length; i++) {
      allNormals.push(normals[i]);
    }
    for (const idx of indices) {
      allIndices.push(idx + vertexOffset);
    }
    vertexOffset += nVerts;
  }

  return { positions: allPositions, normals: allNormals, indices: allIndices };
}

/**
 * Build a simple low-poly robot by combining box and cylinder parts.
 */
function buildRobot() {
  const box = buildBox();
  const cyl = buildCylinder(10);

  function part(geo, scale, translate) {
    return { positions: geo.positions, normals: geo.normals, indices: geo.indices, transform: { scale, translate } };
  }

  return mergeGeometry([
    part(box, [0.6, 0.5, 0.4],   [0, 0.55, 0]),       // torso
    part(box, [0.35, 0.3, 0.35], [0, 1.0, 0]),         // head
    part(box, [0.08, 0.08, 0.05],[-0.09, 1.05, 0.18]), // eye L
    part(box, [0.08, 0.08, 0.05],[ 0.09, 1.05, 0.18]), // eye R
    part(box, [0.12, 0.4, 0.12], [-0.42, 0.55, 0]),    // arm L
    part(box, [0.12, 0.4, 0.12], [ 0.42, 0.55, 0]),    // arm R
    part(cyl, [0.15, 0.3, 0.3],  [-0.38, 0.15, 0]),    // wheel L
    part(cyl, [0.15, 0.3, 0.3],  [ 0.38, 0.15, 0]),    // wheel R
    part(cyl, [0.25, 0.15, 0.25],[0, 0.08, 0]),         // base caster
  ]);
}

// ---------------------------------------------------------------------------
// Generate all models
// ---------------------------------------------------------------------------

const OUT_DIR = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const models = [
  { filename: 'crate-box.glb',   geo: buildBox(),          color: [0.65, 0.44, 0.24, 1.0], name: 'CrateBox',    metallic: 0.0, roughness: 0.9 },
  { filename: 'barrel.glb',      geo: buildCylinder(16),   color: [0.15, 0.37, 0.72, 1.0], name: 'Barrel',      metallic: 0.4, roughness: 0.6 },
  { filename: 'traffic-cone.glb',geo: buildCone(16),        color: [0.98, 0.48, 0.10, 1.0], name: 'TrafficCone', metallic: 0.0, roughness: 0.85 },
  { filename: 'robot-scout.glb', geo: buildRobot(),         color: [0.45, 0.50, 0.55, 1.0], name: 'RobotScout',  metallic: 0.6, roughness: 0.5 },
];

for (const model of models) {
  const { positions, normals, indices } = model.geo;
  const buf = makeGLB(positions, normals, indices, model.color, model.name, model.metallic, model.roughness);
  const outPath = path.join(OUT_DIR, model.filename);
  fs.writeFileSync(outPath, buf);
  console.log(`✅ ${model.filename} — ${buf.length} bytes, ${positions.length/3} verts, ${indices.length/3} tris`);
}

console.log('\nDone. Files written to', OUT_DIR);
