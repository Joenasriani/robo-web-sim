'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Suspense, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import RobotControls from '@/components/RobotControls';
import LessonsSidebar from '@/components/LessonsSidebar';
import ScenarioSelector from '@/components/ScenarioSelector';
import SimFeedback from '@/components/SimFeedback';
import TelemetryPanel from '@/components/TelemetryPanel';
import SimSettings from '@/components/SimSettings';
import EventLog from '@/components/EventLog';
import StoreHydrator from '@/components/StoreHydrator';
import CurrentContextPanel from '@/components/CurrentContextPanel';
import MobileTabPanel from '@/components/MobileTabPanel';
import OnboardingStrip from '@/components/OnboardingStrip';
import EditModeBadge from '@/components/EditModeBadge';
import ModelLibrary from '@/components/ModelLibrary';
import MobileEditOverlay from '@/components/MobileEditOverlay';
import BlocklyPanel from '@/components/BlocklyPanel';
import CollapsibleSection from '@/components/CollapsibleSection';
import CommandQueue from '@/components/CommandQueue';
import { useSimulatorStore } from '@/sim/robotController';

// Dynamic import to avoid SSR issues with Three.js
const Arena3D = dynamic(() => import('@/components/Arena3D'), { ssr: false });
// build: default authoring, edit: arena asset manipulation, run: active simulation monitoring
type WorkspaceMode = 'build' | 'edit' | 'run';

function resolveWorkspaceMode(isEditMode: boolean, simState: string): WorkspaceMode {
  if (isEditMode) return 'edit';
  if (simState !== 'idle') return 'run';
  return 'build';
}

function CenterModeTabs({
  isEditMode,
  simState,
  onSetEditMode,
}: {
  isEditMode: boolean;
  simState: string;
  onSetEditMode: (active: boolean) => void;
}) {
  const canEdit = simState === 'idle';
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <button
        type="button"
        onClick={() => onSetEditMode(false)}
        className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
          !isEditMode
            ? 'bg-blue-600 text-white'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        }`}
      >
        Simulate
      </button>
      <button
        type="button"
        onClick={() => onSetEditMode(true)}
        disabled={!canEdit}
        className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
          isEditMode
            ? 'bg-amber-500 text-slate-900'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
        } disabled:cursor-not-allowed disabled:opacity-50`}
      >
        Edit Arena
      </button>
    </div>
  );
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
  const desktopLayoutRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<{
    side: 'left' | 'right';
    containerLeft: number;
    containerWidth: number;
  } | null>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [rightPanelWidth, setRightPanelWidth] = useState(400);

  const isEditMode = useSimulatorStore((s) => s.isEditMode);
  const simState = useSimulatorStore((s) => s.simState);
  const setEditMode = useSimulatorStore((s) => s.setEditMode);
  const setIsDesktopLayout = useSimulatorStore((s) => s.setIsDesktopLayout);
  const clearPlacementTool = useSimulatorStore((s) => s.clearPlacementTool);
  const deleteSelectedEditObject = useSimulatorStore((s) => s.deleteSelectedEditObject);
  const workspaceMode = useMemo(() => resolveWorkspaceMode(isEditMode, simState), [isEditMode, simState]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncDesktopLayout = () => setIsDesktopLayout(mediaQuery.matches);
    syncDesktopLayout();
    mediaQuery.addEventListener('change', syncDesktopLayout);
    return () => mediaQuery.removeEventListener('change', syncDesktopLayout);
  }, [setIsDesktopLayout]);

  useEffect(() => {
    if (!isEditMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearPlacementTool();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const activeEl = document.activeElement;
        if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
          return;
        }
        deleteSelectedEditObject();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearPlacementTool, deleteSelectedEditObject, isEditMode]);

  useEffect(() => {
    const stopDragging = () => {
      dragStateRef.current = null;
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };

    const onPointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const minSidePanelWidth = 220;
      const minCenterWidth = 360;
      const maxPanelWidth =
        dragState.containerWidth - minCenterWidth - minSidePanelWidth;
      if (maxPanelWidth <= minSidePanelWidth) return;

      if (dragState.side === 'left') {
        const nextWidth = event.clientX - dragState.containerLeft;
        const clampedWidth = Math.min(Math.max(nextWidth, minSidePanelWidth), maxPanelWidth);
        setLeftPanelWidth(clampedWidth);
        return;
      }

      const pointerFromLeft = event.clientX - dragState.containerLeft;
      const rightFromLeft = dragState.containerWidth - pointerFromLeft;
      const clampedWidth = Math.min(Math.max(rightFromLeft, minSidePanelWidth), maxPanelWidth);
      setRightPanelWidth(clampedWidth);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, []);

  const startPanelResize = (side: 'left' | 'right') => (event: ReactPointerEvent<HTMLDivElement>) => {
    const container = desktopLayoutRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragStateRef.current = {
      side,
      containerLeft: rect.left,
      containerWidth: rect.width,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    event.preventDefault();
  };

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
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-700 bg-slate-900/60">
            <CenterModeTabs isEditMode={isEditMode} simState={simState} onSetEditMode={setEditMode} />
          </div>
          <main className="relative flex-1 min-h-0">
            <Arena3D />
            <SimFeedback />
            <EditModeBadge />
            {/* Canvas interaction hint */}
            <div className="absolute bottom-2 left-2 text-xs text-slate-500 pointer-events-none hidden sm:block">
              Drag to orbit • Scroll to zoom • Right-drag to pan
            </div>
            <div className="absolute bottom-2 left-2 text-xs text-slate-600 pointer-events-none sm:hidden">
              Drag to orbit • Pinch to zoom
            </div>
          </main>
        </div>
      </div>

      <div
        ref={desktopLayoutRef}
        data-testid="simulator-desktop-grid"
        className="hidden lg:flex lg:flex-1 lg:min-h-0 lg:overflow-hidden"
      >
        <aside
          className="h-full min-h-0 overflow-hidden border-r border-slate-700 bg-slate-800"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <div className="h-full min-h-0 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              <ScenarioSelector />
              <hr className="border-slate-700" />
              <LessonsSidebar />
            </div>
          </div>
        </aside>

        <div
          role="separator"
          aria-label="Resize left panel"
          aria-orientation="vertical"
          onPointerDown={startPanelResize('left')}
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-slate-700/60 transition-colors hover:bg-blue-500/80 lg:block"
        />

        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-slate-700 bg-slate-900/60">
            <CenterModeTabs isEditMode={isEditMode} simState={simState} onSetEditMode={setEditMode} />
          </div>
          <main className="relative flex-1 min-h-0">
            <Arena3D />
            <SimFeedback />
            <EditModeBadge />
            <div className="absolute bottom-2 left-2 text-xs text-slate-500 pointer-events-none hidden sm:block">
              Drag to orbit • Scroll to zoom • Right-drag to pan
            </div>
            <div className="absolute bottom-2 left-2 text-xs text-slate-600 pointer-events-none sm:hidden">
              Drag to orbit • Pinch to zoom
            </div>
          </main>
        </div>

        <div
          role="separator"
          aria-label="Resize right panel"
          aria-orientation="vertical"
          onPointerDown={startPanelResize('right')}
          className="hidden w-1.5 shrink-0 cursor-col-resize bg-slate-700/60 transition-colors hover:bg-blue-500/80 lg:block"
        />

        <aside
          data-testid="desktop-right-panel"
          className="h-full min-h-0 overflow-hidden border-l border-slate-700 bg-slate-800"
          style={{ width: `${rightPanelWidth}px` }}
        >
          <div className="flex h-full min-h-0 flex-col" data-testid="desktop-right-panel-content">
            <section
              data-testid="right-dock-primary-workspace"
              className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4"
            >
              <div className="flex min-h-full flex-col gap-4">
                {workspaceMode === 'build' && (
                  <>
                    <BlocklyPanel className="flex-1" prioritizeWorkspace />
                    <div>
                      <CommandQueue />
                    </div>
                    <div>
                      <RobotControls showMovementControls={false} />
                    </div>
                    <div>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Simulation Setup</h3>
                      <SimSettings showHeader={false} />
                    </div>
                    <CollapsibleSection
                      title="Telemetry"
                      storageKey="sim-ui-build-collapsible-telemetry-open"
                      defaultOpen={false}
                    >
                      <TelemetryPanel showHeader={false} />
                    </CollapsibleSection>
                    <CollapsibleSection
                      title="Event Log"
                      storageKey="sim-ui-build-collapsible-event-log-open"
                      defaultOpen={false}
                    >
                      <EventLog showHeader={false} />
                    </CollapsibleSection>
                  </>
                )}

                {workspaceMode === 'edit' && (
                  <>
                    <div className="rounded-lg border border-amber-700/50 bg-amber-900/20 p-3">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-300">Object Edit Controls</h3>
                      <MobileEditOverlay />
                    </div>
                    <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-3">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-300">Assets / Props / Model Library</h3>
                      <ModelLibrary />
                    </div>
                  </>
                )}

                {workspaceMode === 'run' && (
                  <>
                    <div>
                      <RobotControls showMovementControls={false} />
                    </div>
                    <CollapsibleSection
                      title="Telemetry"
                      storageKey="sim-ui-run-collapsible-telemetry-open"
                      defaultOpen
                    >
                      <TelemetryPanel showHeader={false} />
                    </CollapsibleSection>
                    <CollapsibleSection
                      title="Event Log"
                      storageKey="sim-ui-run-collapsible-event-log-open"
                      defaultOpen
                    >
                      <EventLog showHeader={false} />
                    </CollapsibleSection>
                  </>
                )}
              </div>
            </section>
          </div>
        </aside>
      </div>

      {/* Mobile / tablet bottom tab panel (hidden on desktop) */}
      <MobileTabPanel />
    </div>
  );
}
