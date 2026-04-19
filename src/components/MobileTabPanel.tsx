'use client';

import { useState } from 'react';
import RobotControls from '@/components/RobotControls';
import ScenarioSelector from '@/components/ScenarioSelector';
import CommandQueue from '@/components/CommandQueue';
import TelemetryPanel from '@/components/TelemetryPanel';
import EventLog from '@/components/EventLog';
import LessonsSidebar from '@/components/LessonsSidebar';
import ArenaEditor from '@/components/ArenaEditor';
import ModelLibrary from '@/components/ModelLibrary';
import SavedScenes from '@/components/SavedScenes';
import MobileEditOverlay from '@/components/MobileEditOverlay';
import BlocklyPanel from '@/components/BlocklyPanel';
import { useSimulatorStore } from '@/sim/robotController';

type Tab = 'lessons' | 'scenarios' | 'blocks' | 'info';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'lessons',   label: 'Lessons',   icon: '📚' },
  { id: 'scenarios', label: 'Scenarios', icon: '🗺️' },
  { id: 'blocks',    label: 'Blocks',    icon: '🧩' },
  { id: 'info',      label: 'Info',      icon: '📊' },
];

export default function MobileTabPanel() {
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const [activeTab, setActiveTab] = useState<Tab>('blocks');
  const effectiveActiveTab: Tab = isEditMode ? 'blocks' : activeTab;

  return (
    <div className="lg:hidden flex flex-col shrink-0">
      {/* Persistent content panel — normal document flow below the 3D canvas */}
      <div className="bg-slate-800 border-t border-slate-700 overflow-y-auto max-h-[45vh] min-h-[280px] p-3">
        {effectiveActiveTab === 'lessons' && (
          <div className="flex flex-col gap-4">
            <LessonsSidebar />
          </div>
        )}
        {effectiveActiveTab === 'scenarios' && (
          <div className="flex flex-col gap-4">
            <ScenarioSelector />
          </div>
        )}
        {effectiveActiveTab === 'blocks' && (
          <div className="flex min-h-[520px] flex-col gap-4">
            {isEditMode ? (
              <>
                <div className="space-y-4">
                  <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
                    EDIT MODE: ON
                  </div>
                  <MobileEditOverlay />
                  <ArenaEditor />
                  <ModelLibrary />
                  <SavedScenes />
                </div>
              </>
            ) : (
              <>
                <div className="min-h-[360px]">
                  <BlocklyPanel className="h-full" />
                </div>
                <hr className="border-slate-700" />
                <CommandQueue />
                <hr className="border-slate-700" />
                <RobotControls showMovementControls={false} />
              </>
            )}
          </div>
        )}
        {effectiveActiveTab === 'info' && (
          <div className="flex flex-col gap-4">
            <TelemetryPanel />
            <hr className="border-slate-700" />
            <EventLog />
          </div>
        )}
      </div>

      {/* Bottom tab bar — fixed to viewport bottom on mobile */}
      <nav
        className="bg-slate-800 border-t border-slate-700 flex z-50 fixed bottom-0 left-0 right-0"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Simulator panels"
      >
        {TABS.map((tab) => {
          const isTabDisabled = isEditMode && tab.id !== 'blocks';
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isTabDisabled) {
                  setActiveTab(tab.id);
                }
              }}
              disabled={isTabDisabled}
              aria-disabled={isTabDisabled}
              aria-pressed={effectiveActiveTab === tab.id}
              aria-label={tab.label}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors min-h-[52px] touch-manipulation ${
                effectiveActiveTab === tab.id
                  ? 'bg-slate-700 text-blue-400'
                  : 'text-slate-400 active:bg-slate-700 active:text-slate-200'
              } ${isTabDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
              <span className="text-[11px]">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
