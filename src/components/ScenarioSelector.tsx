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

  const isFreePlay = activeLesson === null;

  function handleLoad(id: string) {
    loadScenario(id);
    setExpanded(null);
  }

  return (
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

      {/* Scenario list */}
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
  );
}
