'use client';

import { useSimulatorStore } from '@/sim/robotController';

/**
 * Small overlay badge shown on the 3D canvas when arena edit mode is active.
 * Provides a clear visual signal that the simulator is in edit mode vs run mode.
 */
export default function EditModeBadge() {
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  if (!isEditMode) return null;

  return (
    <div
      className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10
                 bg-amber-500/90 text-slate-900 text-xs font-bold px-3 py-1 rounded-full
                 flex items-center gap-1.5 shadow-lg"
      role="status"
      aria-live="polite"
    >
      <span aria-hidden="true">✏️</span>
      Edit Mode — tap or click objects to select
    </div>
  );
}
