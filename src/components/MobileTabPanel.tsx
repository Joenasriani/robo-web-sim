'use client';

import { useState } from 'react';
import RobotControls from '@/components/RobotControls';
import QuickActions from '@/components/QuickActions';
import ArenaEditor from '@/components/ArenaEditor';
import ScenarioSelector from '@/components/ScenarioSelector';
import LessonsSidebar from '@/components/LessonsSidebar';
import CommandQueue from '@/components/CommandQueue';
import SimSettings from '@/components/SimSettings';
import TelemetryPanel from '@/components/TelemetryPanel';
import EventLog from '@/components/EventLog';
import ModelLibrary from '@/components/ModelLibrary';
import SavedScenes from '@/components/SavedScenes';

type Tab = 'controls' | 'scenarios' | 'models' | 'scenes' | 'queue' | 'info';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
}

const TABS: TabDef[] = [
  { id: 'controls',  label: 'Controls',  icon: '🎮' },
  { id: 'scenarios', label: 'Scenarios', icon: '🗺️' },
  { id: 'models',    label: 'Models',    icon: '📦' },
  { id: 'scenes',    label: 'Scenes',    icon: '💾' },
  { id: 'queue',     label: 'Queue',     icon: '⚡' },
  { id: 'info',      label: 'Info',      icon: '📊' },
];

export default function MobileTabPanel() {
  const [activeTab, setActiveTab] = useState<Tab | null>(null);

  const toggle = (tab: Tab) => {
    setActiveTab((prev) => (prev === tab ? null : tab));
  };

  return (
    <div className="lg:hidden flex flex-col shrink-0">
      {/* Expandable panel — max 50vh so canvas is still visible */}
      {activeTab && (
        <div className="bg-slate-800 border-t border-slate-700 overflow-y-auto max-h-[50vh] p-3">
          {/* Panel header with close button */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {TABS.find((t) => t.id === activeTab)?.label}
            </span>
            <button
              onClick={() => setActiveTab(null)}
              aria-label="Close panel"
              className="text-slate-500 hover:text-white text-xs leading-none transition-colors p-1 -mr-1 touch-manipulation"
            >
              ✕ Close
            </button>
          </div>

          {activeTab === 'controls' && (
            <div className="flex flex-col gap-4">
              <RobotControls />
              <hr className="border-slate-700" />
              <QuickActions />
              <hr className="border-slate-700" />
              <ArenaEditor />
            </div>
          )}
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
          {activeTab === 'queue' && (
            <div className="flex flex-col gap-4">
              <CommandQueue />
              <hr className="border-slate-700" />
              <SimSettings />
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
      )}

      {/* Bottom tab bar */}
      <nav className="bg-slate-800 border-t border-slate-700 flex shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => toggle(tab.id)}
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
