# Model Assets — Attribution & Licenses

This directory contains 3D model files (`.glb`) used in the robo-web-sim Model Library.

## Asset Policy

- Only permissive-licensed assets are included (CC0, MIT, CC-BY 4.0 where attribution is provided).
- No live API integrations — all assets are committed locally.
- Assets are kept small and optimised for web loading.

---

## Included Assets

### crate-box.glb
- **Name:** Crate Box
- **Description:** Minimal GLB box primitive (placeholder geometry, Kenney-style)
- **Creator:** robo-web-sim (minimal procedural GLB)
- **License:** CC0 1.0 Universal
- **License URL:** https://creativecommons.org/publicdomain/zero/1.0/
- **Notes:** Generated as a minimal valid GLB scene node. Replace with a real
  Kenney crate asset from https://kenney.nl (CC0) for production use.

### traffic-cone.glb
- **Name:** Traffic Cone
- **Description:** Minimal GLB cone primitive (placeholder geometry, Kenney-style)
- **Creator:** robo-web-sim (minimal procedural GLB)
- **License:** CC0 1.0 Universal
- **License URL:** https://creativecommons.org/publicdomain/zero/1.0/
- **Notes:** Generated as a minimal valid GLB scene node. Replace with a real
  Kenney / Quaternius cone asset for production use.

### barrel.glb
- **Name:** GLB Barrel
- **Description:** Minimal GLB cylinder primitive (placeholder geometry, Kenney-style)
- **Creator:** robo-web-sim (minimal procedural GLB)
- **License:** CC0 1.0 Universal
- **License URL:** https://creativecommons.org/publicdomain/zero/1.0/
- **Notes:** Generated as a minimal valid GLB scene node. Replace with a real
  Kenney barrel asset from https://kenney.nl (CC0) for production use.

---

## Recommended Real Sources (for production upgrade)

| Source      | URL                           | License        |
|-------------|-------------------------------|----------------|
| Kenney      | https://kenney.nl/assets      | CC0 1.0        |
| Quaternius  | https://quaternius.com        | CC0 1.0        |
| Khronos glTF samples | https://github.com/KhronosGroup/glTF-Sample-Assets | Various (see repo) |

---

## Preview Images

Preview thumbnails are stored in `/public/model-previews/` as SVG files,
rendered in the Model Library UI when a `previewImage` path is set on a model entry.
