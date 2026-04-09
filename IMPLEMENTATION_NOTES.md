# Implementation Notes

## Key Decisions

- **SSR Safety**: Arena3D is dynamically imported (`ssr: false`) to avoid Three.js server-side issues
- **localStorage**: Wrapped with `typeof window !== 'undefined'` guard for SSR compatibility
- **Collision Detection**: AABB (Axis-Aligned Bounding Box) for obstacles, radius-based for targets
- **Command Queue**: Async loop with 600ms delay between commands; supports pause/resume/stop

## Known Limitations

- Arena configuration is static (not editable at runtime)
- No undo for individual command queue items (only remove-last or clear-all)
