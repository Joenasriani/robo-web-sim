'use client';

import { useSimulatorStore } from '@/sim/robotController';
import { getModelById } from '@/models/modelLibrary';

export default function ArenaEditor() {
  const isEditMode               = useSimulatorStore((s) => s.isEditMode);
  const activeLesson             = useSimulatorStore((s) => s.activeLesson);
  const selectedEditObject       = useSimulatorStore((s) => s.selectedEditObject);
  const arena                    = useSimulatorStore((s) => s.arena);
  const setEditMode              = useSimulatorStore((s) => s.setEditMode);
  const deselectEditObject       = useSimulatorStore((s) => s.deselectEditObject);
  const clearPlacementTool       = useSimulatorStore((s) => s.clearPlacementTool);
  const moveSelectedObject       = useSimulatorStore((s) => s.moveSelectedObject);
  const rotateSelectedObject     = useSimulatorStore((s) => s.rotateSelectedObject);
  const deleteSelectedObstacle   = useSimulatorStore((s) => s.deleteSelectedObstacle);
  const duplicateSelectedObstacle = useSimulatorStore((s) => s.duplicateSelectedObstacle);
  const addObstacle              = useSimulatorStore((s) => s.addObstacle);
  const resetArenaToDefault      = useSimulatorStore((s) => s.resetArenaToDefault);

  // Edit mode is only available in free-play
  if (activeLesson !== null) return null;

  // Resolve selected object details
  const selectedObs = selectedEditObject?.type === 'obstacle'
    ? arena.obstacles.find((o) => o.id === selectedEditObject.id)
    : undefined;
  const selectedTgt = selectedEditObject?.type === 'target'
    ? arena.targets.find((t) => t.id === selectedEditObject.id)
    : undefined;

  // Look up model library metadata if this obstacle was placed from the library
  const placedModel = selectedObs?.modelId ? getModelById(selectedObs.modelId) : undefined;

  // Human-readable selection label
  let selectionLabel = 'Nothing selected';
  if (selectedObs) {
    const name = placedModel?.name ?? 'Obstacle';
    selectionLabel = `${name} (${selectedObs.position[0].toFixed(1)}, ${selectedObs.position[2].toFixed(1)})`;
  } else if (selectedTgt) {
    selectionLabel = `Target (${selectedTgt.position[0].toFixed(1)}, ${selectedTgt.position[2].toFixed(1)})`;
  }

  const hasSelection = selectedEditObject !== null;
  const canDelete    = hasSelection && selectedEditObject?.type === 'obstacle';
  const canRotate    = hasSelection && selectedEditObject?.type === 'obstacle';
  const canDuplicate = hasSelection && selectedEditObject?.type === 'obstacle';

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
          Arena Edit
        </span>
        <button
          onClick={() => {
            if (isEditMode) {
              deselectEditObject();
              clearPlacementTool();
            }
            setEditMode(!isEditMode);
          }}
          className={`text-[10px] rounded px-2 py-1 transition-colors ${isEditMode ? 'bg-amber-700/40 text-amber-300' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
          title={isEditMode ? 'Disable edit mode' : 'Enable edit mode'}
        >
          {isEditMode ? 'Edit Mode: ON' : 'Edit Mode: OFF'}
        </button>
      </div>

      {!isEditMode && (
        <p className="text-[10px] text-slate-500 leading-snug">
          Enable Edit Mode to place assets or modify objects in the arena.
        </p>
      )}

      {isEditMode && (
        <>
      {/* Edit mode hint */}
      <p className="text-[10px] text-slate-500 leading-snug">
        Tap or click an obstacle or target in the 3D view to select it, then use the controls below.
      </p>

      {/* Selection indicator */}
      <div className={`rounded px-2 py-1 text-[11px] font-medium leading-snug ${
        hasSelection ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' : 'bg-slate-700/40 text-slate-500'
      }`}>
        {hasSelection ? `✔ ${selectionLabel}` : 'Nothing selected — click an object'}
      </div>

      {/* Model metadata panel — shown when a library-placed obstacle is selected */}
      {placedModel && (
        <div className="rounded border border-slate-600 bg-slate-800/60 px-2 py-1.5 space-y-0.5">
          <p className="text-[10px] font-semibold text-slate-300 leading-snug">{placedModel.name}</p>
          <dl className="grid grid-cols-2 gap-x-2 text-[9px] text-slate-400">
            <div>
              <dt className="inline font-medium text-slate-500">Category: </dt>
              <dd className="inline">{placedModel.category}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">Type: </dt>
              <dd className="inline">{placedModel.renderType === 'glb' ? 'GLB' : 'Built-in'}</dd>
            </div>
            <div className="col-span-2">
              <dt className="inline font-medium text-slate-500">Source: </dt>
              <dd className="inline">{placedModel.source}</dd>
            </div>
            <div className="col-span-2">
              <dt className="inline font-medium text-slate-500">ID: </dt>
              <dd className="inline font-mono text-slate-500">{placedModel.id}</dd>
            </div>
          </dl>
        </div>
      )}

      {/* Directional movement */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] text-slate-600 uppercase tracking-wide">Move selected</span>
        <div className="grid grid-cols-3 gap-0.5 w-fit">
          <div />
          <button
            onClick={() => moveSelectedObject('north')}
            disabled={!hasSelection}
            className="btn-small disabled:opacity-30 px-2"
            title="Move north (–Z)"
          >▲</button>
          <div />
          <button
            onClick={() => moveSelectedObject('west')}
            disabled={!hasSelection}
            className="btn-small disabled:opacity-30 px-2"
            title="Move west (–X)"
          >◀</button>
          <button
            onClick={deselectEditObject}
            disabled={!hasSelection}
            className="btn-small disabled:opacity-30 px-1.5 text-[10px]"
            title="Deselect"
          >✕</button>
          <button
            onClick={() => moveSelectedObject('east')}
            disabled={!hasSelection}
            className="btn-small disabled:opacity-30 px-2"
            title="Move east (+X)"
          >▶</button>
          <div />
          <button
            onClick={() => moveSelectedObject('south')}
            disabled={!hasSelection}
            className="btn-small disabled:opacity-30 px-2"
            title="Move south (+Z)"
          >▼</button>
          <div />
        </div>
      </div>

      {/* Rotation */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-slate-600 uppercase tracking-wide flex-1">Rotate</span>
        <button
          onClick={() => rotateSelectedObject('ccw')}
          disabled={!canRotate}
          className="btn-small disabled:opacity-30 px-2"
          title="Rotate 45° counter-clockwise"
        >↺</button>
        <button
          onClick={() => rotateSelectedObject('cw')}
          disabled={!canRotate}
          className="btn-small disabled:opacity-30 px-2"
          title="Rotate 45° clockwise"
        >↻</button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={addObstacle}
          className="btn-small"
          title="Add a new obstacle to the arena"
        >
          ➕ Add Obstacle
        </button>
        <button
          onClick={duplicateSelectedObstacle}
          disabled={!canDuplicate}
          className="btn-small disabled:opacity-30"
          title={canDuplicate ? 'Duplicate selected obstacle' : 'Select an obstacle first'}
        >
          📋 Duplicate
        </button>
        <button
          onClick={deleteSelectedObstacle}
          disabled={!canDelete}
          className="btn-small disabled:opacity-30"
          title={canDelete ? 'Remove selected obstacle' : 'Select an obstacle first'}
        >
          🗑️ Delete
        </button>
        <button
          onClick={resetArenaToDefault}
          className="btn-small"
          title="Reset arena to this scenario's default layout"
        >
          🔁 Reset Arena
        </button>
      </div>

      {/* Counts */}
      <p className="text-[10px] text-slate-600 leading-snug">
        {arena.obstacles.length} obstacle{arena.obstacles.length !== 1 ? 's' : ''} · {arena.targets.length} target{arena.targets.length !== 1 ? 's' : ''}
      </p>
        </>
      )}
    </div>
  );
}
