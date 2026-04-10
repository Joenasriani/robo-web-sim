'use client';

import { useState } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import type { SavedScene } from '@/sim/savedScenes';

function formatDate(ts: number): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return '—';
  }
}

function SceneRow({
  scene,
  onLoad,
  onRename,
  onDelete,
}: {
  scene: SavedScene;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(scene.name);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== scene.name) {
      onRename(scene.id, trimmed);
    }
    setRenaming(false);
  }

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      {/* Row header */}
      <button
        className="w-full text-left px-3 py-2 flex items-center gap-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${scene.name} — ${expanded ? 'collapse' : 'expand'}`}
      >
        <span className="text-base leading-none" aria-hidden="true">📁</span>
        <span className="text-xs font-medium text-slate-300 flex-1 truncate leading-snug">
          {scene.name}
        </span>
        <span aria-hidden="true" className="text-slate-500 text-xs shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Meta */}
          <div className="text-[10px] text-slate-500 space-y-0.5">
            <div>
              <span className="text-slate-600">Saved: </span>
              <span className="text-slate-400">{formatDate(scene.savedAt)}</span>
            </div>
            {scene.scenarioBase && (
              <div>
                <span className="text-slate-600">Base: </span>
                <span className="text-slate-400">{scene.scenarioBase}</span>
              </div>
            )}
            <div>
              <span className="text-slate-600">Obstacles: </span>
              <span className="text-slate-400">{scene.arena.obstacles.length}</span>
              <span className="text-slate-600 ml-2">Targets: </span>
              <span className="text-slate-400">{scene.arena.targets.length}</span>
            </div>
          </div>

          {/* Rename inline form */}
          {renaming ? (
            <div className="flex gap-1">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                className="flex-1 text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
                maxLength={60}
                aria-label="New scene name"
              />
              <button
                onClick={submitRename}
                className="btn-small shrink-0"
                aria-label="Confirm rename"
              >
                ✓
              </button>
              <button
                onClick={() => setRenaming(false)}
                className="btn-small shrink-0"
                aria-label="Cancel rename"
              >
                ✕
              </button>
            </div>
          ) : null}

          {/* Action buttons */}
          {!renaming && (
            <div className="flex gap-1">
              <button
                onClick={() => onLoad(scene.id)}
                className="btn-green text-xs flex-1"
                aria-label={`Load scene: ${scene.name}`}
              >
                📂 Load
              </button>
              <button
                onClick={() => { setRenameValue(scene.name); setRenaming(true); }}
                className="btn-small text-xs shrink-0"
                aria-label={`Rename scene: ${scene.name}`}
                title="Rename"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(scene.id)}
                className="btn-small text-xs shrink-0 text-red-400 hover:text-red-300"
                aria-label={`Delete scene: ${scene.name}`}
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SavedScenes() {
  const activeLesson      = useSimulatorStore((s) => s.activeLesson);
  const arena             = useSimulatorStore((s) => s.arena);
  const savedScenes       = useSimulatorStore((s) => s.savedScenes);
  const saveCurrentScene  = useSimulatorStore((s) => s.saveCurrentScene);
  const loadSavedScene    = useSimulatorStore((s) => s.loadSavedScene);
  const renameSavedScene  = useSimulatorStore((s) => s.renameSavedScene);
  const deleteSavedScene  = useSimulatorStore((s) => s.deleteSavedScene);

  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  // id of scene pending load confirmation
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);
  // id of scene pending delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Saved scenes panel is free-play only
  if (activeLesson !== null) return null;

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    saveCurrentScene(name);
    setSaveName('');
    setShowSaveForm(false);
  }

  function handleRequestLoad(id: string) {
    // If the arena has any objects, confirm before replacing
    const hasContent = arena.obstacles.length > 0 || arena.targets.length > 0;
    if (hasContent) {
      setPendingLoadId(id);
    } else {
      loadSavedScene(id);
    }
  }

  function handleConfirmLoad() {
    if (pendingLoadId) loadSavedScene(pendingLoadId);
    setPendingLoadId(null);
  }

  function handleRequestDelete(id: string) {
    setPendingDeleteId(id);
  }

  function handleConfirmDelete() {
    if (pendingDeleteId) deleteSavedScene(pendingDeleteId);
    setPendingDeleteId(null);
  }

  const pendingDeleteScene = savedScenes.find((s) => s.id === pendingDeleteId);
  const pendingLoadScene   = savedScenes.find((s) => s.id === pendingLoadId);

  return (
    <>
      {/* Load confirmation dialog */}
      {pendingLoadId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="load-scene-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-5 max-w-xs w-full mx-4">
            <h2 id="load-scene-title" className="text-sm font-bold text-white mb-2">
              Replace current arena?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-1">
              Loading <span className="font-semibold text-white">&ldquo;{pendingLoadScene?.name}&rdquo;</span> will
              replace the current free-play arena and reset the robot.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Unsaved arena changes will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPendingLoadId(null)} className="btn-secondary text-xs px-3">
                Cancel
              </button>
              <button onClick={handleConfirmLoad} className="btn-green text-xs px-3">
                Load Scene
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {pendingDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-scene-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-5 max-w-xs w-full mx-4">
            <h2 id="delete-scene-title" className="text-sm font-bold text-white mb-2">
              Delete saved scene?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              <span className="font-semibold text-white">&ldquo;{pendingDeleteScene?.name}&rdquo;</span> will be
              permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPendingDeleteId(null)} className="btn-secondary text-xs px-3">
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {/* Section header */}
        <div>
          <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
            Saved Scenes
          </h3>
          <p className="text-[10px] text-slate-600 leading-snug">
            Save and reload your free-play arena layouts locally.
          </p>
        </div>

        {/* Save current scene */}
        {showSaveForm ? (
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setShowSaveForm(false);
              }}
              placeholder="Scene name…"
              className="text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              autoFocus
              maxLength={60}
              aria-label="Scene name"
            />
            <div className="flex gap-1">
              <button
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="btn-green text-xs flex-1 disabled:opacity-50"
                aria-label="Confirm save"
              >
                💾 Save
              </button>
              <button
                onClick={() => setShowSaveForm(false)}
                className="btn-secondary text-xs shrink-0"
                aria-label="Cancel save"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveForm(true)}
            className="btn-small w-full text-left"
            aria-label="Save current scene"
          >
            💾 Save Current Scene
          </button>
        )}

        {/* Saved scene list */}
        {savedScenes.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1 text-center">
            No saved scenes yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {savedScenes.map((scene) => (
              <SceneRow
                key={scene.id}
                scene={scene}
                onLoad={handleRequestLoad}
                onRename={renameSavedScene}
                onDelete={handleRequestDelete}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
