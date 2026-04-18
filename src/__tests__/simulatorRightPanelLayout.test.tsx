import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mockStoreState = {
  addCommand: jest.fn(),
  robot: { isRunningQueue: false },
};

jest.mock('next/dynamic', () => {
  return () => {
    const DynamicStub = () => <div>MOCK_DYNAMIC</div>;
    return DynamicStub;
  };
});

jest.mock('next/link', () => {
  return function LinkMock({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

jest.mock('@/components/RobotControls', () => {
  return function RobotControlsMock(props: { showMovementControls?: boolean; showQueueControls?: boolean }) {
    const showMovementControls = props.showMovementControls ?? true;
    const showQueueControls = props.showQueueControls ?? true;
    return (
      <div>
        {showQueueControls ? 'RIGHT_PLAY_PAUSE_STOP_CONTENT' : ''}
        {showMovementControls ? 'RIGHT_MOVEMENT_CONTROLS_CONTENT' : ''}
      </div>
    );
  };
});

jest.mock('@/components/CommandQueue', () => {
  return function CommandQueueMock() { return <div>RIGHT_COMMAND_QUEUE</div>; };
});
jest.mock('@/components/SimSettings', () => {
  return function SimSettingsMock() { return <div>RIGHT_SIM_SETTINGS</div>; };
});
jest.mock('@/components/TelemetryPanel', () => {
  return function TelemetryPanelMock() { return <div>RIGHT_TELEMETRY</div>; };
});
jest.mock('@/components/EventLog', () => {
  return function EventLogMock() { return <div>RIGHT_EVENT_LOG</div>; };
});
jest.mock('@/components/QuickActions', () => {
  return function QuickActionsMock() { return <div>RIGHT_QUICK_ACTIONS</div>; };
});
jest.mock('@/components/BlocklyPanel', () => {
  return function BlocklyPanelMock() { return <div>RIGHT_BLOCK_PROGRAMMING</div>; };
});

jest.mock('@/components/LessonsSidebar', () => {
  return function LessonsSidebarMock() { return <div>LESSONS</div>; };
});
jest.mock('@/components/ScenarioSelector', () => {
  return function ScenarioSelectorMock() { return <div>SCENARIOS</div>; };
});
jest.mock('@/components/SimFeedback', () => {
  return function SimFeedbackMock() { return <div>SIM_FEEDBACK</div>; };
});
jest.mock('@/components/StoreHydrator', () => {
  return function StoreHydratorMock() { return null; };
});
jest.mock('@/components/CurrentContextPanel', () => {
  return function CurrentContextPanelMock() { return <div>CONTEXT</div>; };
});
jest.mock('@/components/MobileTabPanel', () => {
  return function MobileTabPanelMock() { return null; };
});
jest.mock('@/components/OnboardingStrip', () => {
  return function OnboardingStripMock() { return null; };
});
jest.mock('@/components/ArenaEditor', () => {
  return function ArenaEditorMock() { return <div>ARENA_EDITOR</div>; };
});
jest.mock('@/components/EditModeBadge', () => {
  return function EditModeBadgeMock() { return null; };
});
jest.mock('@/components/ModelLibrary', () => {
  return function ModelLibraryMock() { return <div>MODEL_LIBRARY</div>; };
});
jest.mock('@/components/SavedScenes', () => {
  return function SavedScenesMock() { return <div>SAVED_SCENES</div>; };
});
jest.mock('@/components/SavedPrograms', () => {
  return function SavedProgramsMock() { return <div>SAVED_PROGRAMS</div>; };
});
jest.mock('@/components/MobileEditOverlay', () => {
  return function MobileEditOverlayMock() { return null; };
});

describe('Desktop right panel layout', () => {
  beforeEach(() => {
    mockStoreState.addCommand = jest.fn();
    mockStoreState.robot = { isRunningQueue: false };
  });

  it('renders desktop right panel components in the requested order with block programming inside it', async () => {
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('data-testid="desktop-right-panel-content"');

    const orderedMarkers = [
      'RIGHT_COMMAND_QUEUE',
      'Play, Pause, Stop',
      'RIGHT_PLAY_PAUSE_STOP_CONTENT',
      'RIGHT_QUICK_ACTIONS',
      'RIGHT_BLOCK_PROGRAMMING',
      'RIGHT_SIM_SETTINGS',
      'RIGHT_TELEMETRY',
      'RIGHT_EVENT_LOG',
      'Movement Controls',
      'RIGHT_MOVEMENT_CONTROLS_CONTENT',
    ];

    const positions = orderedMarkers.map((marker) => html.indexOf(marker));

    positions.forEach((position, idx) => {
      expect(position).toBeGreaterThanOrEqual(0);
      if (idx > 0) {
        expect(position).toBeGreaterThan(positions[idx - 1]);
      }
    });
  });

  it('uses strict 3-column desktop layout and no separate desktop block panel container', async () => {
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('data-testid="simulator-desktop-grid"');
    expect(html).toContain('lg:grid-cols-[280px_minmax(0,1fr)_400px]');
    expect(html).toContain('data-testid="desktop-right-panel"');
    expect(html).not.toContain('data-testid="desktop-block-programming-panel"');
  });

});
