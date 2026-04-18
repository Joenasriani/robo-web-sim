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
import CollapsibleSection from '@/components/CollapsibleSection';
import { useSimulatorStore } from '@/sim/robotController';

// Dynamic import to avoid SSR issues with Three.js
const Arena3D = dynamic(() => import('@/components/Arena3D'), { ssr: false });

type WorkspaceMode = 'build' | 'edit' | 'run';

function resolveWorkspaceMode(args: { isEditMode: boolean; simState: string }): WorkspaceMode {
  if (args.isEditMode) return 'edit';
  if (args.simState !== 'idle') return 'run';
  return 'build';
}

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
  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const simState = useSimulatorStore((s) => s.simState);
  const workspaceMode = resolveWorkspaceMode({ isEditMode, simState });

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
        <h1 className="text-base font-bold text-white">RoboWebSim — Simulator</h1>
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
      <div className="flex flex-1 min-h-0 overflow-hidden lg:hidden">
        <main className="relative flex-1 min-w-0 min-h-0">
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
      </div>

      <div
        data-testid="simulator-desktop-grid"
        className="hidden lg:grid lg:flex-1 lg:min-h-0 lg:grid-cols-[280px_minmax(0,1fr)_400px]"
      >
        <aside className="h-full min-h-0 overflow-hidden border-r border-slate-700 bg-slate-800">
          <div className="h-full min-h-0 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              <ScenarioSelector />
              <hr className="border-slate-700" />
              <LessonsSidebar />
            </div>
          </div>
        </aside>

        <div className="h-full min-h-0 overflow-hidden">
          <main className="relative h-full min-h-0">
            <Arena3D />
            <SimFeedback />
            <EditModeBadge />
            <MobileEditOverlay />
            <div className="absolute bottom-2 left-2 text-xs text-slate-500 pointer-events-none hidden sm:block">
              Drag to orbit • Scroll to zoom • Right-drag to pan
            </div>
            <div className="absolute bottom-2 left-2 text-xs text-slate-600 pointer-events-none sm:hidden">
              Drag to orbit • Pinch to zoom
            </div>
          </main>
        </div>

        <aside data-testid="desktop-right-panel" className="h-full min-h-0 overflow-hidden border-l border-slate-700 bg-slate-800">
          <div className="flex h-full min-h-0 flex-col" data-testid="desktop-right-panel-content">
            <div className="sticky top-0 z-20 shrink-0 border-b border-slate-700 bg-slate-800/95 px-4 pb-3 pt-4 backdrop-blur-sm">
              <div>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Simulation Setup</h3>
                <SimSettings showHeader={false} />
              </div>
              <div className="mt-3">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Play, Pause, Stop</h3>
                <RobotControls showMovementControls={false} />
              </div>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <section
                data-testid="right-dock-primary-workspace"
                className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4"
              >
                <div className="flex min-h-full flex-col gap-4">
                  {workspaceMode === 'build' && (
                    <>
                      <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-300">Build Workspace</h3>
                        <p className="text-xs text-slate-500">Compose and refine robot command programs.</p>
                      </div>
                      <QuickActions />
                      <BlocklyPanel className="min-h-[460px]" prioritizeWorkspace />
                      <SavedPrograms />
                    </>
                  )}

                  {workspaceMode === 'edit' && (
                    <>
                      <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-300">Edit Workspace</h3>
                        <p className="text-xs text-slate-500">Arrange arena assets and placement tools.</p>
                      </div>
                      <ArenaEditor />
                      <ModelLibrary />
                      <SavedScenes />
                    </>
                  )}

                  {workspaceMode === 'run' && (
                    <>
                      <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-300">Run Workspace</h3>
                        <p className="text-xs text-slate-500">Track execution while the simulator is active.</p>
                      </div>
                      <QuickActions />
                      <CommandQueue />
                    </>
                  )}
                </div>
              </section>

              <section
                data-testid="right-dock-secondary-monitors"
                className="shrink-0 border-t border-slate-700 px-4 py-3"
              >
                <div className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto pr-1">
                  <CollapsibleSection
                    title="Telemetry"
                    storageKey="sim-ui-collapsible-telemetry-open"
                    defaultOpen={false}
                  >
                    <TelemetryPanel showHeader={false} />
                  </CollapsibleSection>
                  <CollapsibleSection
                    title="Event Log"
                    storageKey="sim-ui-collapsible-event-log-open"
                    defaultOpen={false}
                  >
                    <EventLog showHeader={false} />
                  </CollapsibleSection>
                </div>
              </section>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile / tablet bottom tab panel (hidden on desktop) */}
      <MobileTabPanel />
    </div>
  );
}
