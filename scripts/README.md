# Scripts

Utility scripts used by RoboWebSim.

## `generate-models.js`

Generates the procedural GLB assets used by the local model library.

Current generated assets include:

- `crate-box.glb`
- `barrel.glb`
- `traffic-cone.glb`
- `robot-scout.glb`

Run:

```bash
node scripts/generate-models.js
```

Generated files are written to:

```text
scripts/out/
```

The shipped GLB assets are then copied into `public/models/`.

The geometry produced by this generator is documented as CC0 1.0 in `public/models/README.md`.
