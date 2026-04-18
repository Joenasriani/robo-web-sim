'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useEffect, useRef, useState } from 'react';
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
  const [isBlockPanelOpen, setIsBlockPanelOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col text-white overflow-hidden pb-[52px] lg:pb-0" style={{ background: 'var(--rm-bg)' }}>
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
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-white">RoboWebSim — Simulator</h1>
          <button
            type="button"
            className="hidden lg:inline-flex btn-secondary text-xs"
            onClick={() => setIsBlockPanelOpen((open) => !open)}
            aria-expanded={isBlockPanelOpen}
            aria-controls="desktop-block-programming-panel"
          >
            {isBlockPanelOpen ? 'Close Block Programming' : 'Open Block Programming'}
          </button>
        </div>
        <Link href="/lessons" className="text-sm whitespace-nowrap" style={{ color: 'var(--rm-primary)' }}>
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

        <div className="flex flex-1 min-w-0">
          {/* 3D Canvas */}
          <main className="flex-1 min-w-0 relative">
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

          {/* Docked block programming workspace (desktop only) */}
          <aside
            id="desktop-block-programming-panel"
            data-testid="desktop-block-programming-panel"
            className={`hidden lg:flex shrink-0 min-h-0 bg-slate-800 transition-[width,flex-basis] duration-300 ease-out ${
              isBlockPanelOpen
                ? 'border-l border-slate-700 basis-[40%] min-w-[380px] max-w-[480px]'
                : 'basis-0 w-0 min-w-0 border-l-0 overflow-hidden'
            }`}
          >
            {isBlockPanelOpen && (
              <div className="flex min-h-0 flex-1 flex-col p-3 gap-3">
                <section className="flex min-h-0 flex-[1_1_62%] flex-col">
                  <BlocklyPanel className="min-h-0" />
                </section>
                <section className="flex min-h-0 flex-[1_1_38%] flex-col gap-3 overflow-y-auto pr-1">
                  <CommandQueue />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Play, Pause, Stop</h3>
                    <RobotControls showMovementControls={false} />
                  </div>
                  <SimSettings />
                  <QuickActions />
                  <TelemetryPanel />
                  <EventLog />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-2">Movement Controls</h3>
                    <RobotControls showQueueControls={false} />
                  </div>
                  <ArenaEditor />
                  <ModelLibrary />
                  <SavedScenes />
                  <SavedPrograms />
                </section>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Mobile / tablet bottom tab panel (hidden on desktop) */}
      <MobileTabPanel />
    </div>
  );
}
