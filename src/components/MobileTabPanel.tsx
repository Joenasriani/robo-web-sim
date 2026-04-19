'use client';

import { useState } from 'react';
import RobotControls from '@/components/RobotControls';
import ScenarioSelector from '@/components/ScenarioSelector';
import LessonsSidebar from '@/components/LessonsSidebar';
import CommandQueue from '@/components/CommandQueue';
import TelemetryPanel from '@/components/TelemetryPanel';
import EventLog from '@/components/EventLog';
import ArenaEditor from '@/components/ArenaEditor';
import ModelLibrary from '@/components/ModelLibrary';
import SavedScenes from '@/components/SavedScenes';
import BlocklyPanel from '@/components/BlocklyPanel';
import { useSimulatorStore } from '@/sim/robotController';

type Tab = 'scenarios' | 'blocks' | 'info';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'scenarios', label: 'Scenarios', icon: '🗺️' },
  { id: 'blocks',    label: 'Blocks',    icon: '🧩' },
  { id: 'info',      label: 'Info',      icon: '📊' },
];

export default function MobileTabPanel() {
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const [activeTab, setActiveTab] = useState<Tab>('blocks');
  const effectiveTab: Tab = isEditMode && activeTab !== 'info' ? 'scenarios' : activeTab;

  return (
    <div className="lg:hidden flex flex-col shrink-0">
      {/* Persistent content panel — normal document flow below the 3D canvas */}
      <div className="bg-slate-800 border-t border-slate-700 overflow-y-auto max-h-[45vh] p-3">
        {effectiveTab === 'scenarios' && (
          <div className="flex flex-col gap-4">
            {isEditMode ? (
              <>
                <ArenaEditor />
                <hr className="border-slate-700" />
                <ModelLibrary />
                <hr className="border-slate-700" />
                <SavedScenes />
              </>
            ) : (
              <>
                <ScenarioSelector />
                <hr className="border-slate-700" />
                <LessonsSidebar />
                <p className="text-[10px] text-slate-500 leading-snug">
                  Switch to Edit Arena (top center tab) to access Assets and Saved Scenes.
                </p>
              </>
            )}
          </div>
        )}
        {effectiveTab === 'blocks' && (
          <div className="flex flex-col gap-4">
            <BlocklyPanel />
            <hr className="border-slate-700" />
            <CommandQueue />
            <hr className="border-slate-700" />
            <RobotControls showMovementControls={false} />
          </div>
        )}
        {effectiveTab === 'info' && (
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
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            aria-pressed={effectiveTab === tab.id}
            aria-label={tab.label}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors min-h-[52px] touch-manipulation ${
              effectiveTab === tab.id
                ? 'bg-slate-700 text-blue-400'
                : 'text-slate-400 active:bg-slate-700 active:text-slate-200'
            }`}
          >
            <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
            <span className="text-[11px]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
