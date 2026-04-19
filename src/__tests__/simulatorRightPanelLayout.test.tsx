import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mockStoreState = {
  addCommand: jest.fn(),
  robot: { isRunningQueue: false },
  isEditMode: false,
  simState: 'idle',
  setEditMode: jest.fn(),
  clearPlacementTool: jest.fn(),
  deleteSelectedEditObject: jest.fn(),
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

jest.mock('@/components/SimSettings', () => {
  return function SimSettingsMock() { return <div>RIGHT_SIM_SETTINGS</div>; };
});
jest.mock('@/components/TelemetryPanel', () => {
  return function TelemetryPanelMock() { return <div>RIGHT_TELEMETRY</div>; };
});
jest.mock('@/components/EventLog', () => {
  return function EventLogMock() { return <div>RIGHT_EVENT_LOG</div>; };
});
jest.mock('@/components/BlocklyPanel', () => {
  return function BlocklyPanelMock() { return <div>RIGHT_BLOCK_PROGRAMMING</div>; };
});
jest.mock('@/components/CommandQueue', () => {
  return function CommandQueueMock() { return <div>RIGHT_COMMAND_QUEUE</div>; };
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
jest.mock('@/components/EditModeBadge', () => {
  return function EditModeBadgeMock() { return null; };
});
jest.mock('@/components/ModelLibrary', () => {
  return function ModelLibraryMock() { return <div>MODEL_LIBRARY</div>; };
});
jest.mock('@/components/MobileEditOverlay', () => {
  return function MobileEditOverlayMock() { return <div>RIGHT_OBJECT_EDIT_CONTROLS</div>; };
});

describe('Desktop right panel layout', () => {
  beforeEach(() => {
    mockStoreState.addCommand = jest.fn();
    mockStoreState.robot = { isRunningQueue: false };
    mockStoreState.isEditMode = false;
    mockStoreState.simState = 'idle';
    mockStoreState.setEditMode = jest.fn();
    mockStoreState.clearPlacementTool = jest.fn();
    mockStoreState.deleteSelectedEditObject = jest.fn();
  });

  it('renders build mode workspace with block programming first, then controls, setup, and collapsed monitors', async () => {
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('data-testid="desktop-right-panel-content"');

    const orderedMarkers = [
      'RIGHT_BLOCK_PROGRAMMING',
      'RIGHT_COMMAND_QUEUE',
      'RIGHT_PLAY_PAUSE_STOP_CONTENT',
      'Simulation Setup',
      'RIGHT_SIM_SETTINGS',
      'RIGHT_TELEMETRY',
      'RIGHT_EVENT_LOG',
    ];

    const positions = orderedMarkers.map((marker) => html.indexOf(marker));

    positions.forEach((position, idx) => {
      expect(position).toBeGreaterThanOrEqual(0);
      if (idx > 0) {
        expect(position).toBeGreaterThan(positions[idx - 1]);
      }
    });

    expect(html).not.toContain('MODEL_LIBRARY');
    expect(html).not.toContain('right-dock-secondary-monitors');
    expect((html.match(/grid-template-rows:0fr/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('renders edit mode with object edit controls and model library while hiding build/run tools', async () => {
    mockStoreState.isEditMode = true;
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('Object Edit Controls');
    expect(html).toContain('RIGHT_OBJECT_EDIT_CONTROLS');
    expect(html).toContain('Assets / Props / Model Library');
    expect(html).toContain('MODEL_LIBRARY');
    expect(html).not.toContain('RIGHT_BLOCK_PROGRAMMING');
    expect(html).not.toContain('RIGHT_COMMAND_QUEUE');
    expect(html).not.toContain('RIGHT_SIM_SETTINGS');
    expect(html).not.toContain('RIGHT_PLAY_PAUSE_STOP_CONTENT');
  });

  it('renders run mode with controls first and expanded telemetry/event log', async () => {
    mockStoreState.simState = 'running';
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    const orderedMarkers = [
      'RIGHT_PLAY_PAUSE_STOP_CONTENT',
      'RIGHT_TELEMETRY',
      'RIGHT_EVENT_LOG',
    ];
    const positions = orderedMarkers.map((marker) => html.indexOf(marker));
    positions.forEach((position, idx) => {
      expect(position).toBeGreaterThanOrEqual(0);
      if (idx > 0) {
        expect(position).toBeGreaterThan(positions[idx - 1]);
      }
    });

    expect((html.match(/grid-template-rows:1fr/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect(html).not.toContain('RIGHT_BLOCK_PROGRAMMING');
    expect(html).not.toContain('RIGHT_COMMAND_QUEUE');
    expect(html).not.toContain('RIGHT_SIM_SETTINGS');
  });

  it('uses strict 3-column desktop layout and no separate desktop block panel container', async () => {
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('data-testid="simulator-desktop-grid"');
    expect(html).toContain('lg:grid-cols-[280px_minmax(0,1fr)_400px]');
    expect(html).toContain('data-testid="desktop-right-panel"');
    expect(html).not.toContain('data-testid="desktop-block-programming-panel"');
  });

  it('keeps right-panel workspace as a single mode-driven scroll area', async () => {
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('data-testid="right-dock-primary-workspace"');
    expect(html).not.toContain('data-testid="right-dock-secondary-monitors"');
    expect(html).toContain('RIGHT_BLOCK_PROGRAMMING');
    expect(html).toContain('RIGHT_COMMAND_QUEUE');
    expect(html).toContain('Simulation Setup');
  });

  it('shows center mode switch tabs above the shared canvas workspace', async () => {
    const { default: SimulatorPage } = await import('@/app/simulator/page');
    const html = renderToStaticMarkup(<SimulatorPage />);

    expect(html).toContain('Simulate');
    expect(html).toContain('Edit Arena');
  });

});
