'use client';

import { useState } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import { FREE_PLAY_SCENARIOS } from '@/scenarios';

const DIFFICULTY_BADGE: Record<string, string> = {
  beginner:     'text-green-400 bg-green-900/40 border border-green-800',
  intermediate: 'text-yellow-400 bg-yellow-900/40 border border-yellow-800',
  advanced:     'text-red-400 bg-red-900/40 border border-red-800',
};

export default function ScenarioSelector() {
  const activeScenarioId = useSimulatorStore((s) => s.activeScenarioId);
  const activeLesson     = useSimulatorStore((s) => s.activeLesson);
  const loadScenario     = useSimulatorStore((s) => s.loadScenario);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const isFreePlay = activeLesson === null;

  function handleLoad(id: string) {
    if (!isFreePlay) {
      // Lesson is active — show confirmation before switching
      setPendingId(id);
      return;
    }
    loadScenario(id);
    setExpanded(null);
  }

  function confirmSwitch() {
    if (pendingId) {
      loadScenario(pendingId);
      setExpanded(null);
    }
    setPendingId(null);
  }

  function cancelSwitch() {
    setPendingId(null);
  }

  return (
    <>
      {/* Transition confirmation dialog */}
      {pendingId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="leave-lesson-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl p-5 max-w-xs w-full mx-4">
            <h2 id="leave-lesson-title" className="text-sm font-bold text-white mb-2">
              Leave lesson mode?
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Loading a free-play scenario will leave the current lesson and reset
              its live progress state for this session.
            </p>
            <div className="flex gap-2 justify-end">
              <button onClick={cancelSwitch} className="btn-secondary text-xs px-3">
                Cancel
              </button>
              <button onClick={confirmSwitch} className="btn-green text-xs px-3">
                Load Scenario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario list */}
      <div className="flex flex-col gap-2">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">
            Free-Play Scenarios
          </h3>
          {isFreePlay ? (
            <span className="text-xs text-blue-400 font-semibold bg-blue-900/30 rounded px-1.5 py-0.5">
              ACTIVE
            </span>
          ) : (
            <span className="text-xs text-slate-500 italic">lesson active</span>
          )}
        </div>

        {!isFreePlay && (
          <p className="text-xs text-slate-500 italic leading-relaxed">
            A lesson is active. Expand a scenario below to preview and load it.
          </p>
        )}

        {FREE_PLAY_SCENARIOS.map((scenario) => {
          const isActive   = isFreePlay && activeScenarioId === scenario.id;
          const isExpanded = expanded === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`rounded-lg border transition-colors ${
                isActive
                  ? 'border-blue-500 bg-slate-800'
                  : 'border-slate-700 bg-slate-800/50'
              }`}
            >
              {/* Row header — toggle expand */}
              <button
                className="w-full text-left px-3 py-2 flex items-center gap-2"
                onClick={() => setExpanded(isExpanded ? null : scenario.id)}
                aria-expanded={isExpanded}
                aria-label={`${scenario.title} — ${isExpanded ? 'collapse' : 'expand'} details`}
              >
                <span
                  aria-hidden="true"
                  className={`text-base ${isActive ? 'text-blue-400' : 'text-slate-400'}`}
                >
                  {isActive ? '▶' : '🎮'}
                </span>
                <span className={`text-xs font-medium flex-1 ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {scenario.title}
                </span>
                {isActive && (
                  <span className="text-blue-400 text-xs font-bold">ACTIVE</span>
                )}
                {!isActive && (
                  <span aria-hidden="true" className="text-slate-500 text-xs">{isExpanded ? '▲' : '▼'}</span>
                )}
              </button>

              {/* Expanded detail + metadata */}
              {isExpanded && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Thumbnail placeholder — slot for future mini preview */}
                  <div
                    aria-hidden="true"
                    className="w-full h-12 rounded bg-slate-700/60 border border-slate-600 flex items-center justify-center"
                  >
                    <span className="text-slate-500 text-[10px] uppercase tracking-wide">Preview</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {scenario.description}
                  </p>

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span>
                      <span aria-hidden="true">🎯</span>{' '}
                      Targets:{' '}
                      <span className="text-white">{scenario.arena.targets.length}</span>
                    </span>
                    <span>
                      <span aria-hidden="true">🚧</span>{' '}
                      Obstacles:{' '}
                      <span className="text-white">{scenario.arena.obstacles.length}</span>
                    </span>
                    <span>
                      <span aria-hidden="true">📐</span>{' '}
                      Size:{' '}
                      <span className="text-white">
                        {scenario.arena.size}×{scenario.arena.size}
                      </span>
                    </span>
                    <span
                      className={`text-xs rounded px-1.5 py-0.5 font-semibold ${DIFFICULTY_BADGE[scenario.difficulty]}`}
                    >
                      {scenario.difficulty}
                    </span>
                  </div>

                  {/* Load button */}
                  <button
                    onClick={() => handleLoad(scenario.id)}
                    disabled={isActive}
                    className="btn-secondary text-xs w-full disabled:opacity-50"
                    aria-label={isActive ? `${scenario.title} is already loaded` : `Load ${scenario.title}`}
                  >
                    {isActive ? '✓ Loaded' : '▶ Load Scenario'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
