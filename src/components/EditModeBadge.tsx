'use client';

import { useSimulatorStore } from '@/sim/robotController';

/**
 * Small overlay badge shown on the 3D canvas when arena edit mode is active.
 * Provides a clear visual signal that the simulator is in edit mode vs run mode.
 */
export default function EditModeBadge() {
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const placementTool = useSimulatorStore((s) => s.placementTool);
  if (!isEditMode) return null;

  return (
    <div
      className="absolute top-2 left-1/2 z-10 -translate-x-1/2 rounded-lg border border-amber-300/40
                 bg-amber-500/90 px-3 py-2 text-xs font-bold text-slate-900 shadow-lg pointer-events-none"
      role="status"
      aria-live="polite"
    >
      <p className="flex items-center gap-1.5">
        <span aria-hidden="true">✏️</span>
        Edit Mode Active
      </p>
      {placementTool ? (
        <>
          <p className="mt-1">Placing: {placementTool.modelName}</p>
          <p className="mt-0.5 text-[11px] font-semibold">Click to place • Esc to cancel</p>
        </>
      ) : (
        <p className="mt-1 text-[11px] font-semibold">Select an asset to start placing</p>
      )}
    </div>
  );
}
