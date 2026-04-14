'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import RobotControls from '@/components/RobotControls';
import CommandQueue from '@/components/CommandQueue';
import LessonsSidebar from '@/components/LessonsSidebar';
import ScenarioSelector from '@/components/ScenarioSelector';
import SimFeedback from '@/components/SimFeedback';
import TelemetryPanel from '@/components/TelemetryPanel';
import SimSettings from '@/components/SimSettings';
import EventLog from '@/components/EventLog';
import StoreHydrator from '@/components/StoreHydrator';
import CurrentContextPanel from '@/components/CurrentContextPanel';
import QuickActions from '@/components/QuickActions';
import MobileTabPanel from '@/components/MobileTabPanel';
import OnboardingStrip from '@/components/OnboardingStrip';
import ArenaEditor from '@/components/ArenaEditor';
import EditModeBadge from '@/components/EditModeBadge';
import ModelLibrary from '@/components/ModelLibrary';
import SavedScenes from '@/components/SavedScenes';
import SavedPrograms from '@/components/SavedPrograms';
import BlocklyPanel from '@/components/BlocklyPanel';
import MobileEditOverlay from '@/components/MobileEditOverlay';
import { useSimulatorStore } from '@/sim/robotController';

// Dynamic import to avoid SSR issues with Three.js
const Arena3D = dynamic(() => import('@/components/Arena3D'), { ssr: false });

const VALID_LESSON_IDS = [
  'lesson-1', 'lesson-2', 'lesson-3', 'lesson-4',
  'lesson-5', 'lesson-6', 'lesson-7', 'lesson-8',
];

function LessonDeepLink() {
  const searchParams = useSearchParams();
  const setActiveLesson = useSimulatorStore((s) => s.setActiveLesson);
  const applied = useRef(false);

  useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    const lessonId = searchParams.get('lesson');
    if (lessonId && VALID_LESSON_IDS.includes(lessonId)) {
      setActiveLesson(lessonId);
    }
    // intentional: run once on mount only — query param is stable at page load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default function SimulatorPage() {
  return (
    <div className="h-screen flex flex-col text-white overflow-hidden" style={{ background: 'var(--rm-bg)' }}>
      {/* Hydrate store from localStorage on first client render */}
      <StoreHydrator />
      {/* Apply lesson from query param (takes priority over localStorage-hydrated state) */}
      <Suspense fallback={null}>
        <LessonDeepLink />
      </Suspense>

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ background: 'var(--rm-surface)', borderColor: 'var(--rm-border)' }}>
        <Link href="/" className="text-sm flex items-center gap-1" style={{ color: 'var(--rm-primary)' }}>
          ← Home
        </Link>
        <h1 className="text-base font-bold text-white">RoboWebSim — Simulator</h1>
        <Link href="/lessons" className="text-sm" style={{ color: 'var(--rm-primary)' }}>
          Lessons →
        </Link>
      </header>

      {/* Current context bar — visible above the canvas, full-width */}
      <div className="px-3 py-1.5 border-b shrink-0" style={{ background: 'var(--rm-bg)', borderColor: 'var(--rm-surface)' }}>
        <CurrentContextPanel />
      </div>

      {/* Dismissible beginner onboarding strip */}
      <OnboardingStrip />

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
          <EditModeBadge />
          {/* Touch-friendly edit controls overlay — mobile only, visible when object is selected */}
          <MobileEditOverlay />
          {/* Canvas interaction hint */}
          <div className="absolute bottom-2 left-2 text-xs text-slate-500 pointer-events-none hidden sm:block">
            Drag to orbit • Scroll to zoom • Right-drag to pan
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-slate-600 pointer-events-none sm:hidden">
            Drag to orbit • Pinch to zoom
          </div>
        </main>

        {/* Right sidebar: controls + queue + settings + telemetry + event log (desktop only) */}
        <aside className="hidden lg:flex w-64 bg-slate-800 border-l border-slate-700 overflow-y-auto p-3 shrink-0 flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Movement Controls</h3>
            <RobotControls />
          </div>
          <hr className="border-slate-700" />
          <QuickActions />
          <hr className="border-slate-700" />
          <ArenaEditor />
          <hr className="border-slate-700" />
          <ModelLibrary />
          <hr className="border-slate-700" />
          <SavedScenes />
          <hr className="border-slate-700" />
          <SavedPrograms />
          <hr className="border-slate-700" />
          <BlocklyPanel />
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

      {/* Mobile / tablet bottom tab panel (hidden on desktop) */}
      <MobileTabPanel />
    </div>
  );
}
