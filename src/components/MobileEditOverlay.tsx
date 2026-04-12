'use client';

import { useSimulatorStore } from '@/sim/robotController';
import { getModelById } from '@/models/modelLibrary';

/**
 * Mobile-only floating overlay shown when an object is selected in arena edit
 * mode. Provides large, touch-friendly buttons for move / rotate / delete so
 * the user never has to open the Controls tab to edit a selected object.
 *
 * Hidden on lg+ screens where the ArenaEditor sidebar is always visible.
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

  if (!isEditMode || selectedEditObject === null) return null;

  const selectedObs = selectedEditObject.type === 'obstacle'
    ? arena.obstacles.find((o) => o.id === selectedEditObject.id)
    : undefined;
  const selectedTgt = selectedEditObject.type === 'target'
    ? arena.targets.find((t) => t.id === selectedEditObject.id)
    : undefined;

  const placedModel = selectedObs?.modelId ? getModelById(selectedObs.modelId) : undefined;

  let label = 'Object';
  if (selectedObs) label = placedModel?.name ?? 'Obstacle';
  else if (selectedTgt) label = 'Target';

  const isObstacle = selectedEditObject.type === 'obstacle';

  return (
    <div
      className="lg:hidden absolute bottom-0 left-0 right-0 z-20"
      role="region"
      aria-label={`Edit controls for selected ${label}`}
      style={{ maxHeight: '45vh', overflowY: 'auto' }}
    >
      <div className="bg-slate-900/97 border-t-2 border-amber-500/70 px-3 pt-2 pb-3 flex flex-col gap-2">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            <span aria-hidden="true">✔</span>
            {label} selected
          </span>
          <button
            onClick={deselectEditObject}
            aria-label="Deselect object"
            className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded touch-manipulation active:bg-slate-700"
          >
            ✕ Deselect
          </button>
        </div>

        {/* Controls row: D-pad on left, actions on right */}
        <div className="flex items-center gap-3">
          {/* Move D-pad */}
          <div className="flex flex-col gap-0.5" aria-label="Move selected object">
            <div className="flex justify-center">
              <button
                onClick={() => moveSelectedObject('north')}
                aria-label="Move north"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center"
              >▲</button>
            </div>
            <div className="flex gap-0.5">
              <button
                onClick={() => moveSelectedObject('west')}
                aria-label="Move west"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center"
              >◀</button>
              <div className="w-10 h-10 flex items-center justify-center text-slate-600 text-xs">✥</div>
              <button
                onClick={() => moveSelectedObject('east')}
                aria-label="Move east"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center"
              >▶</button>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => moveSelectedObject('south')}
                aria-label="Move south"
                className="btn-small w-10 h-10 text-lg flex items-center justify-center"
              >▼</button>
            </div>
          </div>

          {/* Rotate + action buttons */}
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            {isObstacle && (
              <div className="flex gap-1">
                <button
                  onClick={() => rotateSelectedObject('ccw')}
                  aria-label="Rotate counter-clockwise"
                  className="btn-small flex-1 h-10 text-sm"
                >↺ CCW</button>
                <button
                  onClick={() => rotateSelectedObject('cw')}
                  aria-label="Rotate clockwise"
                  className="btn-small flex-1 h-10 text-sm"
                >↻ CW</button>
              </div>
            )}
            {isObstacle && (
              <div className="flex gap-1">
                <button
                  onClick={duplicateSelectedObstacle}
                  aria-label="Duplicate obstacle"
                  className="btn-small flex-1 h-10 text-xs"
                >📋 Dup</button>
                <button
                  onClick={deleteSelectedObstacle}
                  aria-label="Delete obstacle"
                  className="flex-1 h-10 bg-red-800 hover:bg-red-700 active:bg-red-600 text-white text-xs font-semibold px-2 rounded transition-colors touch-manipulation select-none"
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
