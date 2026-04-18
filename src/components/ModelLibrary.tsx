'use client';

import { useEffect, useState } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import {
  CURATED_MODELS,
  MODEL_CATEGORIES,
  ModelCategory,
  ModelDefinition,
} from '@/models/modelLibrary';

const CATEGORY_BADGE: Record<ModelCategory, string> = {
  obstacle:    'text-red-400   bg-red-900/30   border border-red-800/60',
  prop:        'text-yellow-400 bg-yellow-900/30 border border-yellow-800/60',
  target:      'text-green-400 bg-green-900/30  border border-green-800/60',
  environment: 'text-blue-400  bg-blue-900/30   border border-blue-800/60',
  robot:       'text-teal-400  bg-teal-900/30   border border-teal-800/60',
};

function ModelCard({
  model,
  onSelectTool,
  selected,
  editModeEnabled,
}: {
  model: ModelDefinition;
  onSelectTool: (id: string) => void;
  selected: boolean;
  editModeEnabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      {/* Card header — always visible */}
      <button
        className="w-full text-left px-3 py-2 flex items-center gap-2"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={`${model.name} — ${expanded ? 'collapse' : 'expand'} details`}
      >
        {/* Thumbnail placeholder */}
        <span
          className="text-xl leading-none w-7 text-center shrink-0"
          aria-hidden="true"
          title={model.name}
        >
          {model.thumbnail}
        </span>
        <span className="text-xs font-medium text-slate-300 flex-1 leading-snug">
          {model.name}
        </span>
        <span
          className={`text-[9px] rounded px-1.5 py-0.5 font-semibold uppercase shrink-0 ${CATEGORY_BADGE[model.category]}`}
        >
          {model.category}
        </span>
        {model.renderType === 'glb' && (
          <span className="text-[9px] rounded px-1.5 py-0.5 font-semibold uppercase shrink-0 text-purple-300 bg-purple-900/30 border border-purple-800/60">
            GLB
          </span>
        )}
        <span aria-hidden="true" className="text-slate-500 text-xs shrink-0">
          {expanded ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
      {/* Thumbnail/Preview area */}
          <div
            aria-hidden="true"
            className="w-full h-14 rounded bg-slate-700/60 border border-slate-600 flex items-center justify-center gap-2 overflow-hidden"
          >
            {model.previewImage ? (
              <img
                src={model.previewImage}
                alt={model.name}
                className="h-12 w-12 object-contain"
                onError={(e) => {
                  // If image fails to load, hide it and fall back to emoji
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (next) next.style.display = '';
                }}
              />
            ) : null}
            <span
              className="text-3xl leading-none"
              style={model.previewImage ? { display: 'none' } : {}}
            >
              {model.thumbnail}
            </span>
            <span className="text-slate-500 text-[10px] uppercase tracking-wide">
              {model.previewImage ? '' : 'Preview'}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-slate-300 leading-relaxed">{model.description}</p>

          {/* Source metadata */}
          <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-400">
            <div>
              <dt className="inline font-medium text-slate-500">Source: </dt>
              <dd className="inline text-slate-300">{model.source}</dd>
            </div>
            <div>
              <dt className="inline font-medium text-slate-500">Creator: </dt>
              <dd className="inline text-slate-300">{model.creator}</dd>
            </div>
            <div className="col-span-2">
              <dt className="inline font-medium text-slate-500">License: </dt>
              {model.licenseUrl ? (
                <dd className="inline">
                  <a
                    href={model.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {model.license}
                  </a>
                </dd>
              ) : (
                <dd className="inline text-slate-300">{model.license}</dd>
              )}
            </div>
          </dl>

          {/* Place button */}
          <button
            onClick={() => { onSelectTool(model.id); setExpanded(false); }}
            disabled={!editModeEnabled}
            className="btn-secondary text-xs w-full"
            aria-label={`Select ${model.name} as placement tool`}
          >
            {selected ? '✅ Placement Tool Selected' : '🎯 Select Placement Tool'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ModelLibrary() {
  const activeLesson = useSimulatorStore((s) => s.activeLesson);
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const placementTool = useSimulatorStore((s) => s.placementTool);
  const selectPlacementTool = useSimulatorStore((s) => s.selectPlacementTool);
  const clearPlacementTool = useSimulatorStore((s) => s.clearPlacementTool);

  const [activeCategory, setActiveCategory] = useState<ModelCategory>('obstacle');

  useEffect(() => {
    if (!isEditMode || !placementTool) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      clearPlacementTool();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearPlacementTool, isEditMode, placementTool]);

  // Model library is only available in free-play mode
  if (activeLesson !== null) return null;

  const visibleModels = CURATED_MODELS.filter((m) => m.category === activeCategory);

  return (
    <div className="flex flex-col gap-2">
      {/* Section header */}
      <div>
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-1">
          Assets
        </h3>
        <p className="text-[10px] text-slate-600 leading-snug">
          Select assets as placement tools for Edit Mode.
        </p>
      </div>
      {isEditMode ? (
        <div className="rounded border border-amber-700/50 bg-amber-900/30 px-2 py-1 text-[10px] text-amber-300">
          <p>{placementTool ? `Placing: ${placementTool.modelName}` : 'No placement tool selected'}</p>
          {placementTool && <p className="mt-0.5 text-[9px]">Click to place • Esc to cancel</p>}
        </div>
      ) : (
        <p className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-[10px] text-slate-400">
          Turn on Edit Mode to select an asset placement tool.
        </p>
      )}

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Model categories">
        {MODEL_CATEGORIES.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            aria-selected={activeCategory === id}
            onClick={() => setActiveCategory(id)}
            className={`text-[10px] rounded px-2 py-0.5 font-medium transition-colors ${
              activeCategory === id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Model cards */}
      <div
        role="tabpanel"
        aria-label={`${activeCategory} models`}
        className="flex flex-col gap-1.5"
      >
        {visibleModels.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2 text-center">
            No models in this category yet.
          </p>
        ) : (
          visibleModels.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onSelectTool={selectPlacementTool}
              selected={placementTool?.modelId === model.id}
              editModeEnabled={isEditMode}
            />
          ))
        )}
      </div>

      {/* Attribution footer */}
      <p className="text-[9px] text-slate-600 leading-snug mt-1">
        v2 · Built-in primitives + local GLB assets · MIT / CC0 ·{' '}
        <a
          href="/models/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          asset credits
        </a>
      </p>
    </div>
  );
}
