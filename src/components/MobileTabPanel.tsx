'use client';

import { useState } from 'react';
import RobotControls from '@/components/RobotControls';
import ScenarioSelector from '@/components/ScenarioSelector';
import LessonsSidebar from '@/components/LessonsSidebar';
import CommandQueue from '@/components/CommandQueue';
import TelemetryPanel from '@/components/TelemetryPanel';
import EventLog from '@/components/EventLog';
import ModelLibrary from '@/components/ModelLibrary';
import SavedScenes from '@/components/SavedScenes';
import BlocklyPanel from '@/components/BlocklyPanel';

type Tab = 'scenarios' | 'models' | 'scenes' | 'blocks' | 'info';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'scenarios', label: 'Scenarios', icon: '🗺️' },
  { id: 'models',    label: 'Assets',    icon: '📦' },
  { id: 'scenes',    label: 'Scenes',    icon: '💾' },
  { id: 'blocks',    label: 'Blocks',    icon: '🧩' },
  { id: 'info',      label: 'Info',      icon: '📊' },
];

export default function MobileTabPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('blocks');

  return (
    <div className="lg:hidden flex flex-col shrink-0">
      {/* Persistent content panel — normal document flow below the 3D canvas */}
      <div className="bg-slate-800 border-t border-slate-700 overflow-y-auto max-h-[45vh] p-3">
        {activeTab === 'scenarios' && (
          <div className="flex flex-col gap-4">
            <ScenarioSelector />
            <hr className="border-slate-700" />
            <LessonsSidebar />
          </div>
        )}
        {activeTab === 'models' && (
          <div className="flex flex-col gap-4">
            <ModelLibrary />
          </div>
        )}
        {activeTab === 'scenes' && (
          <div className="flex flex-col gap-4">
            <SavedScenes />
          </div>
        )}
        {activeTab === 'blocks' && (
          <div className="flex flex-col gap-4">
            <BlocklyPanel />
            <hr className="border-slate-700" />
            <CommandQueue />
            <hr className="border-slate-700" />
            <RobotControls showMovementControls={false} />
          </div>
        )}
        {activeTab === 'info' && (
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
            aria-pressed={activeTab === tab.id}
            aria-label={tab.label}
            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors min-h-[52px] touch-manipulation ${
              activeTab === tab.id
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
