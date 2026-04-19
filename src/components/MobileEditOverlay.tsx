'use client';

import { useSimulatorStore } from '@/sim/robotController';
import { getModelById } from '@/models/modelLibrary';

/**
 * Mobile edit controls rendered inside the Blocks tab while in arena edit mode.
 * This is the single source of object manipulation controls on mobile.
 */
export default function MobileEditOverlay() {
  const isEditMode               = useSimulatorStore((s) => s.isEditMode);
  const selectedEditObject       = useSimulatorStore((s) => s.selectedEditObject);
  const arena                    = useSimulatorStore((s) => s.arena);
  const deselectEditObject       = useSimulatorStore((s) => s.deselectEditObject);
  const moveSelectedObject       = useSimulatorStore((s) => s.moveSelectedObject);
  const rotateSelectedObject     = useSimulatorStore((s) => s.rotateSelectedObject);
  const deleteSelectedObstacle   = useSimulatorStore((s) => s.deleteSelectedObstacle);
  const duplicateSelectedObstacle = useSimulatorStore((s) => s.duplicateSelectedObstacle);

  if (!isEditMode) return null;

  const selectedObs = selectedEditObject?.type === 'obstacle'
    ? arena.obstacles.find((o) => o.id === selectedEditObject.id)
    : undefined;
  const selectedTgt = selectedEditObject?.type === 'target'
    ? arena.targets.find((t) => t.id === selectedEditObject.id)
    : undefined;

  const placedModel = selectedObs?.modelId ? getModelById(selectedObs.modelId) : undefined;

  let label = 'Object';
  if (selectedObs) label = placedModel?.name ?? 'Obstacle';
  else if (selectedTgt) label = 'Target';

  const hasSelection = selectedEditObject !== null;
  const isObstacle = selectedEditObject?.type === 'obstacle';
  const controlsDisabled = !hasSelection;

  return (
    <div
      className="rounded-lg border border-amber-500/40 bg-slate-900/90 p-3"
      role="region"
      aria-label="Object edit controls"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            <span aria-hidden="true">{hasSelection ? '✔' : '•'}</span>
            {hasSelection ? `${label} selected` : 'No object selected'}
          </span>
          <button
            onClick={deselectEditObject}
            disabled={!hasSelection}
            aria-label="Deselect object"
            className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded touch-manipulation active:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ✕ Deselect
          </button>
        </div>
        {!hasSelection && (
          <p className="text-[11px] text-slate-500">
            Select an obstacle or target in the arena to move or rotate it.
          </p>
        )}

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5" aria-label="Move selected object">
            <div className="flex justify-center">
              <button
                onClick={() => moveSelectedObject('north')}
                disabled={controlsDisabled}
                aria-label="Move north"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >▲</button>
            </div>
            <div className="flex gap-0.5">
              <button
                onClick={() => moveSelectedObject('west')}
                disabled={controlsDisabled}
                aria-label="Move west"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >◀</button>
              <div className="w-10 h-10 flex items-center justify-center text-slate-600 text-xs">✥</div>
              <button
                onClick={() => moveSelectedObject('east')}
                disabled={controlsDisabled}
                aria-label="Move east"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >▶</button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => moveSelectedObject('south')}
                disabled={controlsDisabled}
                aria-label="Move south"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
              >▼</button>
            </div>
          </div>

          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {isObstacle && (
              <div className="flex gap-1">
                <button
                  onClick={() => rotateSelectedObject('ccw')}
                  disabled={controlsDisabled}
                  aria-label="Rotate counter-clockwise"
                  className="btn-small flex-1 h-10 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >↺ CCW</button>
                <button
                  onClick={() => rotateSelectedObject('cw')}
                  disabled={controlsDisabled}
                  aria-label="Rotate clockwise"
                  className="btn-small flex-1 h-10 text-sm disabled:cursor-not-allowed disabled:opacity-40"
                >↻ CW</button>
              </div>
            )}
            {isObstacle && (
              <div className="flex gap-1">
                <button
                  onClick={duplicateSelectedObstacle}
                  disabled={controlsDisabled}
                  aria-label="Duplicate obstacle"
                  className="btn-small flex-1 h-10 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                >📋 Dup</button>
                <button
                  onClick={deleteSelectedObstacle}
                  disabled={controlsDisabled}
                  aria-label="Delete obstacle"
                  className="flex-1 h-10 bg-red-800 hover:bg-red-700 active:bg-red-600 text-white text-xs font-semibold px-2 rounded transition-colors touch-manipulation select-none disabled:cursor-not-allowed disabled:opacity-40"
                >🗑️ Delete</button>
              </div>
            )}
            {!isObstacle && (
              <p className="text-[10px] text-slate-500 italic">
                Use move arrows to reposition the target.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
