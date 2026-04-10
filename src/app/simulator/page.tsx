'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import RobotControls from '@/components/RobotControls';
import CommandQueue from '@/components/CommandQueue';
import LessonsSidebar from '@/components/LessonsSidebar';
import ScenarioSelector from '@/components/ScenarioSelector';
import SimFeedback from '@/components/SimFeedback';
import TelemetryPanel from '@/components/TelemetryPanel';
import SimSettings from '@/components/SimSettings';
import EventLog from '@/components/EventLog';

// Dynamic import to avoid SSR issues with Three.js
const Arena3D = dynamic(() => import('@/components/Arena3D'), { ssr: false });

export default function SimulatorPage() {
  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 shrink-0">
        <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1">
          ← Home
        </Link>
        <h1 className="text-base font-bold text-white">🤖 RoboWebSim — Simulator</h1>
        <Link href="/lessons" className="text-blue-400 hover:text-blue-300 text-sm">
          Lessons →
        </Link>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: scenario selector + lessons */}
        <aside className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto p-3 shrink-0 hidden lg:block">
          <div className="flex flex-col gap-4">
            <ScenarioSelector />
            <hr className="border-slate-700" />
            <LessonsSidebar />
          </div>
        </aside>

        {/* 3D Canvas */}
        <main className="flex-1 relative">
          <Arena3D />
          <SimFeedback />
          <div className="absolute bottom-2 left-2 text-xs text-slate-500 pointer-events-none">
            Drag to orbit • Scroll to zoom • Right-drag to pan
          </div>
        </main>

        {/* Right sidebar: controls + queue + settings + telemetry + event log */}
        <aside className="w-64 bg-slate-800 border-l border-slate-700 overflow-y-auto p-3 shrink-0 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Movement Controls</h3>
            <RobotControls />
          </div>
          <hr className="border-slate-700" />
          <CommandQueue />
          <hr className="border-slate-700" />
          <SimSettings />
          <hr className="border-slate-700" />
          <TelemetryPanel />
          <hr className="border-slate-700" />
          <EventLog />
        </aside>
      </div>
    </div>
  );
}
