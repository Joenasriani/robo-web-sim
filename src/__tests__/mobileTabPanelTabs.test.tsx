import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import MobileTabPanel from '@/components/MobileTabPanel';

const mockStoreState = {
  isEditMode: false,
};

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

jest.mock('@/components/RobotControls', () => function RobotControlsMock() { return <div>MOBILE_CONTROLS</div>; });
jest.mock('@/components/ScenarioSelector', () => function ScenarioSelectorMock() { return <div>MOBILE_SCENARIOS</div>; });
jest.mock('@/components/LessonsSidebar', () => function LessonsSidebarMock() { return <div>MOBILE_LESSONS</div>; });
jest.mock('@/components/CommandQueue', () => function CommandQueueMock() { return <div>MOBILE_COMMAND_QUEUE</div>; });
jest.mock('@/components/TelemetryPanel', () => function TelemetryPanelMock() { return <div>MOBILE_TELEMETRY</div>; });
jest.mock('@/components/EventLog', () => function EventLogMock() { return <div>MOBILE_EVENT_LOG</div>; });
jest.mock('@/components/ArenaEditor', () => function ArenaEditorMock() { return <div>MOBILE_ARENA_EDITOR</div>; });
jest.mock('@/components/ModelLibrary', () => function ModelLibraryMock() { return <div>MOBILE_MODEL_LIBRARY</div>; });
jest.mock('@/components/SavedScenes', () => function SavedScenesMock() { return <div>MOBILE_SAVED_SCENES</div>; });
jest.mock('@/components/BlocklyPanel', () => function BlocklyPanelMock() { return <div>MOBILE_BLOCKLY_PANEL</div>; });

describe('MobileTabPanel tabs', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    mockStoreState.isEditMode = false;
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('keeps blocks tab consolidated and removes controls, queue, assets, and scenes tabs', () => {
    act(() => {
      root.render(<MobileTabPanel />);
    });

    const blocksTab = container.querySelector('button[aria-label="Blocks"]');
    const controlsTab = container.querySelector('button[aria-label="Controls"]');
    const queueTab = container.querySelector('button[aria-label="Queue"]');
    const assetsTab = container.querySelector('button[aria-label="Assets"]');
    const scenesTab = container.querySelector('button[aria-label="Scenes"]');
    expect(blocksTab).not.toBeNull();
    expect(controlsTab).toBeNull();
    expect(queueTab).toBeNull();
    expect(assetsTab).toBeNull();
    expect(scenesTab).toBeNull();
    expect(container.textContent).toContain('MOBILE_BLOCKLY_PANEL');
    expect(container.textContent).toContain('MOBILE_COMMAND_QUEUE');
    expect(container.textContent).toContain('MOBILE_CONTROLS');
  });

  it('shows arena edit stack (editor, assets, scenes) in scenarios panel when edit mode is active', () => {
    mockStoreState.isEditMode = true;

    act(() => {
      root.render(<MobileTabPanel />);
    });

    expect(container.textContent).toContain('MOBILE_ARENA_EDITOR');
    expect(container.textContent).toContain('MOBILE_MODEL_LIBRARY');
    expect(container.textContent).toContain('MOBILE_SAVED_SCENES');
    expect(container.textContent).not.toContain('MOBILE_SCENARIOS');
    expect(container.textContent).not.toContain('MOBILE_LESSONS');
  });
});
