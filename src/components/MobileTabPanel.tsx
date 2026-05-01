'use client';

import { useEffect, useState } from 'react';
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
import BlocklyPanel, { APPEND_BLOCKLY_COMMAND_EVENT } from '@/components/BlocklyPanel';
import { useSimulatorStore } from '@/sim/robotController';
import type { CommandType } from '@/sim/commandExecution';

type Tab = 'program' | 'queue' | 'arena' | 'info';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
}

interface QuickAddCommand {
  type: CommandType;
  label: string;
  icon: string;
  className: string;
}

const TABS: TabDef[] = [
  { id: 'program', label: 'Program', icon: '🧩' },
  { id: 'queue',   label: 'Queue',   icon: '▶' },
  { id: 'arena',   label: 'Arena',   icon: '🗺️' },
  { id: 'info',    label: 'Info',    icon: '📊' },
];

const QUICK_ADD_COMMANDS: QuickAddCommand[] = [
  {
    type: 'forward',
    label: 'Forward',
    icon: '↑',
    className: 'bg-emerald-800/70 hover:bg-emerald-700/80 border-emerald-600/50 text-emerald-200',
  },
  {
    type: 'backward',
    label: 'Backward',
    icon: '↓',
    className: 'bg-sky-800/70 hover:bg-sky-700/80 border-sky-600/50 text-sky-200',
  },
  {
    type: 'left',
    label: 'Left',
    icon: '↺',
    className: 'bg-violet-800/70 hover:bg-violet-700/80 border-violet-600/50 text-violet-200',
  },
  {
    type: 'right',
    label: 'Right',
    icon: '↻',
    className: 'bg-violet-800/70 hover:bg-violet-700/80 border-violet-600/50 text-violet-200',
  },
  {
    type: 'wait',
    label: 'Wait',
    icon: '⏸',
    className: 'bg-amber-800/70 hover:bg-amber-700/80 border-amber-600/50 text-amber-200',
  },
];

function MobileQuickAdd({ isRunning }: { isRunning: boolean }) {
  const appendCommand = (command: CommandType) => {
    window.dispatchEvent(new CustomEvent(APPEND_BLOCKLY_COMMAND_EVENT, { detail: command }));
  };

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/40 p-3" aria-label="Quick-add queue commands">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Quick-Add</h3>
        <span className="text-[11px] text-slate-500">adds real blocks</span>
      </div>
      <div className="grid grid-cols-5 gap-1.5">
        {QUICK_ADD_COMMANDS.map((command) => (
          <button
            key={command.type}
            type="button"
            onClick={() => appendCommand(command.type)}
            disabled={isRunning}
            title={isRunning ? 'Stop the queue first' : `Add ${command.label} to Program and Queue`}
            className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded border px-1 py-1.5 text-center text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation select-none ${command.className}`}
          >
            <span className="text-sm leading-none">{command.icon}</span>
            <span className="text-[9px]">{command.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function MobileTabPanel() {
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const isRunning = useSimulatorStore((s) => s.robot.isRunningQueue);
  const commandQueueLength = useSimulatorStore((s) => s.commandQueue.length);
  const [activeTab, setActiveTab] = useState<Tab>('program');

  useEffect(() => {
    if (isEditMode) {
      setActiveTab('arena');
    }
  }, [isEditMode]);

  useEffect(() => {
    window.dispatchEvent(new Event('resize'));
  }, [activeTab]);

  return (
    <div className="lg:hidden flex flex-col shrink-0">
      {/* Persistent content panel — normal document flow below the 3D canvas */}
      <div className="bg-slate-800 border-t border-slate-700 overflow-y-auto max-h-[45vh] min-h-[280px] p-3">
        <div className={activeTab === 'program' ? 'block' : 'hidden'}>
          <div className="flex min-h-[430px] flex-col gap-3">
            <div className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Program Blocks</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                  {commandQueueLength} queued
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Build the robot program here. The Command Queue updates automatically as blocks change.
              </p>
            </div>
            <div className="min-h-[360px]">
              <BlocklyPanel className="h-full" showQuickAdd={false} />
            </div>
          </div>
        </div>

        {activeTab === 'queue' && (
          <div className="flex flex-col gap-4">
            <div className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Run Queue</h2>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[11px] text-slate-400">
                  {commandQueueLength} cmd{commandQueueLength !== 1 ? 's' : ''}
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Add commands here, review the queue, then run, pause, resume, or stop the simulation.
              </p>
            </div>
            <MobileQuickAdd isRunning={isRunning} />
            <CommandQueue />
            <hr className="border-slate-700" />
            <RobotControls showMovementControls={false} />
          </div>
        )}

        {activeTab === 'arena' && (
          <div className="flex flex-col gap-4">
            {isEditMode ? (
              <>
                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-amber-300">
                  EDIT MODE: ON
                </div>
                <MobileEditOverlay />
                <ArenaEditor />
                <ModelLibrary />
                <SavedScenes />
              </>
            ) : (
              <>
                <div className="rounded-md border border-slate-700 bg-slate-900/60 px-3 py-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">Arena Setup</h2>
                  <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                    Choose a scenario or lesson. Switch to Edit Arena above the canvas to place or adjust objects.
                  </p>
                </div>
                <ScenarioSelector />
                <hr className="border-slate-700" />
                <LessonsSidebar />
              </>
            )}
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
