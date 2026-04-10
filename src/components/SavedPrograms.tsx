'use client';

import { useRef, useState } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import { buildProgramExport, validateImportedProgram } from '@/sim/savedPrograms';
import type { SavedProgram } from '@/sim/savedPrograms';

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

/** Trigger a browser file download with the given JSON content. */
function downloadJson(filename: string, data: unknown): void {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    /* silently ignore download failures */
  }
}

function ProgramRow({
  program,
  onLoad,
  onRename,
  onDelete,
  onExport,
}: {
  program: SavedProgram;
  onLoad: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onExport: (program: SavedProgram) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(program.name);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== program.name) {
      onRename(program.id, trimmed);
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
        aria-label={`${program.name} — ${expanded ? 'collapse' : 'expand'}`}
      >
        <span className="text-base leading-none" aria-hidden="true">📋</span>
        <span className="text-xs font-medium text-slate-300 flex-1 truncate leading-snug">
          {program.name}
        </span>
        <span className="text-[10px] text-slate-500 shrink-0 tabular-nums mr-1">
          {program.commands.length} cmd{program.commands.length !== 1 ? 's' : ''}
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
              <span className="text-slate-400">{formatDate(program.createdAt)}</span>
            </div>
            {program.updatedAt !== program.createdAt && (
              <div>
                <span className="text-slate-600">Updated: </span>
                <span className="text-slate-400">{formatDate(program.updatedAt)}</span>
              </div>
            )}
            {program.commands.length > 0 && (
              <div className="text-slate-500 leading-relaxed truncate">
                {program.commands.map((c) => c.label).join(' → ')}
              </div>
            )}
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
                aria-label="New program name"
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
                onClick={() => onLoad(program.id)}
                className="btn-green text-xs flex-1"
                aria-label={`Load program: ${program.name}`}
              >
                📂 Load
              </button>
              <button
                onClick={() => onExport(program)}
                className="btn-small text-xs shrink-0"
                aria-label={`Export program: ${program.name}`}
                title="Export as JSON"
              >
                ⬇️
              </button>
              <button
                onClick={() => { setRenameValue(program.name); setRenaming(true); }}
                className="btn-small text-xs shrink-0"
                aria-label={`Rename program: ${program.name}`}
                title="Rename"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(program.id)}
                className="btn-small text-xs shrink-0 text-red-400 hover:text-red-300"
                aria-label={`Delete program: ${program.name}`}
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

export default function SavedPrograms() {
  const commandQueue      = useSimulatorStore((s) => s.commandQueue);
  const isRunning         = useSimulatorStore((s) => s.robot.isRunningQueue);
  const savedPrograms     = useSimulatorStore((s) => s.savedPrograms);
  const saveCurrentProgram  = useSimulatorStore((s) => s.saveCurrentProgram);
  const loadSavedProgram    = useSimulatorStore((s) => s.loadSavedProgram);
  const renameSavedProgram  = useSimulatorStore((s) => s.renameSavedProgram);
  const deleteSavedProgram  = useSimulatorStore((s) => s.deleteSavedProgram);
  const importProgram       = useSimulatorStore((s) => s.importProgram);

  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);
  // id of program pending load confirmation
  const [pendingLoadId, setPendingLoadId] = useState<string | null>(null);
  // id of program pending delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  // error message for import failures
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    saveCurrentProgram(name);
    setSaveName('');
    setShowSaveForm(false);
  }

  function handleRequestLoad(id: string) {
    if (commandQueue.length > 0) {
      setPendingLoadId(id);
    } else {
      loadSavedProgram(id);
    }
  }

  function handleConfirmLoad() {
    if (pendingLoadId) loadSavedProgram(pendingLoadId);
    setPendingLoadId(null);
  }

  function handleRequestDelete(id: string) {
    setPendingDeleteId(id);
  }

  function handleConfirmDelete() {
    if (pendingDeleteId) deleteSavedProgram(pendingDeleteId);
    setPendingDeleteId(null);
  }

  function handleExport(program: SavedProgram) {
    const safeName = program.name.replace(/[^a-z0-9_\- ]/gi, '_').trim() || 'program';
    downloadJson(`${safeName}.json`, buildProgramExport(program));
  }

  function handleImportClick() {
    setImportError(null);
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    setImportError(null);
    const file = e.target.files?.[0];
    // Reset the file input so the same file can be re-imported if needed
    e.target.value = '';
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text !== 'string' || text.trim() === '') {
        setImportError('File is empty.');
        return;
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setImportError('Invalid JSON — could not parse file.');
        return;
      }
      const result = validateImportedProgram(parsed);
      if (!result.ok) {
        setImportError(result.error);
        return;
      }
      importProgram(result.data);
    };
    reader.onerror = () => {
      setImportError('Failed to read file.');
    };
    reader.readAsText(file);
  }

  const pendingDeleteProgram = savedPrograms.find((p) => p.id === pendingDeleteId);
  const pendingLoadProgram   = savedPrograms.find((p) => p.id === pendingLoadId);

  return (
    <>
      {/* Load confirmation dialog */}
      {pendingLoadId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="load-prog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-5 max-w-xs w-full mx-4">
            <h2 id="load-prog-title" className="text-sm font-bold text-white mb-2">
              Replace current queue?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-1">
              Loading <span className="font-semibold text-white">&ldquo;{pendingLoadProgram?.name}&rdquo;</span> will
              replace the {commandQueue.length} command{commandQueue.length !== 1 ? 's' : ''} in the current queue.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              The current queue will be lost.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setPendingLoadId(null)} className="btn-secondary text-xs px-3">
                Cancel
              </button>
              <button onClick={handleConfirmLoad} className="btn-green text-xs px-3">
                Load Program
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
          aria-labelledby="delete-prog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-5 max-w-xs w-full mx-4">
            <h2 id="delete-prog-title" className="text-sm font-bold text-white mb-2">
              Delete saved program?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              <span className="font-semibold text-white">&ldquo;{pendingDeleteProgram?.name}&rdquo;</span> will be
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
            Saved Programs
          </h3>
          <p className="text-[10px] text-slate-600 leading-snug">
            Save and reload your command sequences locally.
          </p>
        </div>

        {/* Save current queue */}
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
              placeholder="Program name…"
              className="text-xs rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              autoFocus
              maxLength={60}
              aria-label="Program name"
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
          <div className="flex gap-1">
            <button
              onClick={() => setShowSaveForm(true)}
              disabled={isRunning || commandQueue.length === 0}
              className="btn-small flex-1 text-left disabled:opacity-50"
              aria-label="Save current queue as a program"
              title={commandQueue.length === 0 ? 'Add commands to the queue first' : isRunning ? 'Stop the queue first' : 'Save current queue'}
            >
              💾 Save Queue
            </button>
            <button
              onClick={handleImportClick}
              className="btn-small shrink-0"
              aria-label="Import program from JSON file"
              title="Import from JSON"
            >
              📥 Import
            </button>
          </div>
        )}

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          aria-hidden="true"
          onChange={handleImportFile}
        />

        {/* Import error */}
        {importError && (
          <p className="text-[10px] text-red-400 leading-snug" role="alert">
            ⚠️ {importError}
          </p>
        )}

        {/* Saved program list */}
        {savedPrograms.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-1 text-center">
            No saved programs yet.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {savedPrograms.map((program) => (
              <ProgramRow
                key={program.id}
                program={program}
                onLoad={handleRequestLoad}
                onRename={renameSavedProgram}
                onDelete={handleRequestDelete}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
