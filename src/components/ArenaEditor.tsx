'use client';

import { useSimulatorStore } from '@/sim/robotController';

export default function ArenaEditor() {
  const isEditMode          = useSimulatorStore((s) => s.isEditMode);
  const activeLesson        = useSimulatorStore((s) => s.activeLesson);
  const selectedEditObject  = useSimulatorStore((s) => s.selectedEditObject);
  const arena               = useSimulatorStore((s) => s.arena);
  const setEditMode         = useSimulatorStore((s) => s.setEditMode);
  const deselectEditObject  = useSimulatorStore((s) => s.deselectEditObject);
  const moveSelectedObject  = useSimulatorStore((s) => s.moveSelectedObject);
  const deleteSelectedObstacle = useSimulatorStore((s) => s.deleteSelectedObstacle);
  const addObstacle         = useSimulatorStore((s) => s.addObstacle);
  const resetArenaToDefault = useSimulatorStore((s) => s.resetArenaToDefault);

  // Edit mode is only available in free-play
  if (activeLesson !== null) return null;

  if (!isEditMode) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Arena Editor</span>
        <button
          onClick={() => setEditMode(true)}
          className="btn-small w-full text-left"
          title="Open arena editor — add, move, or remove obstacles and targets"
        >
          ✏️ Edit Arena
        </button>
      </div>
    );
  }

  // Determine selected object label
  let selectionLabel = 'Nothing selected';
  if (selectedEditObject) {
    if (selectedEditObject.type === 'obstacle') {
      const obs = arena.obstacles.find((o) => o.id === selectedEditObject.id);
      selectionLabel = obs ? `Obstacle (${obs.position[0].toFixed(1)}, ${obs.position[2].toFixed(1)})` : 'Obstacle';
    } else {
      const tgt = arena.targets.find((t) => t.id === selectedEditObject.id);
      selectionLabel = tgt ? `Target (${tgt.position[0].toFixed(1)}, ${tgt.position[2].toFixed(1)})` : 'Target';
    }
  }

  const hasSelection = selectedEditObject !== null;
  const canDelete = hasSelection && selectedEditObject?.type === 'obstacle';

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">
          ✏️ Edit Mode
        </span>
        <button
          onClick={() => { deselectEditObject(); setEditMode(false); }}
          className="text-[10px] text-slate-400 hover:text-white transition-colors"
          title="Exit edit mode"
        >
          ✕ Done
        </button>
      </div>

      {/* Edit mode hint */}
      <p className="text-[10px] text-slate-500 leading-snug">
        Click an obstacle or target in the 3D view to select it, then use the controls below.
      </p>

      {/* Selection indicator */}
      <div className={`rounded px-2 py-1 text-[11px] font-medium leading-snug ${
        hasSelection ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' : 'bg-slate-700/40 text-slate-500'
      }`}>
        {hasSelection ? `✔ ${selectionLabel}` : 'Nothing selected — click an object'}
      </div>

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
    </div>
  );
}
