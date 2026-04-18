import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import MobileTabPanel from '@/components/MobileTabPanel';

jest.mock('@/components/RobotControls', () => function RobotControlsMock() { return <div>MOBILE_CONTROLS</div>; });
jest.mock('@/components/QuickActions', () => function QuickActionsMock() { return <div>MOBILE_QUICK_ACTIONS</div>; });
jest.mock('@/components/ArenaEditor', () => function ArenaEditorMock() { return <div>MOBILE_ARENA_EDITOR</div>; });
jest.mock('@/components/ScenarioSelector', () => function ScenarioSelectorMock() { return <div>MOBILE_SCENARIOS</div>; });
jest.mock('@/components/LessonsSidebar', () => function LessonsSidebarMock() { return <div>MOBILE_LESSONS</div>; });
jest.mock('@/components/CommandQueue', () => function CommandQueueMock() { return <div>MOBILE_COMMAND_QUEUE</div>; });
jest.mock('@/components/SimSettings', () => function SimSettingsMock() { return <div>MOBILE_SIM_SETTINGS</div>; });
jest.mock('@/components/TelemetryPanel', () => function TelemetryPanelMock() { return <div>MOBILE_TELEMETRY</div>; });
jest.mock('@/components/EventLog', () => function EventLogMock() { return <div>MOBILE_EVENT_LOG</div>; });
jest.mock('@/components/ModelLibrary', () => function ModelLibraryMock() { return <div>MOBILE_MODEL_LIBRARY</div>; });
jest.mock('@/components/SavedScenes', () => function SavedScenesMock() { return <div>MOBILE_SAVED_SCENES</div>; });
jest.mock('@/components/SavedPrograms', () => function SavedProgramsMock() { return <div>MOBILE_SAVED_PROGRAMS</div>; });
jest.mock('@/components/BlocklyPanel', () => function BlocklyPanelMock() { return <div>MOBILE_BLOCKLY_PANEL</div>; });

describe('MobileTabPanel tabs', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
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

  it('includes a dedicated Blocks tab and keeps Queue content separate', () => {
    act(() => {
      root.render(<MobileTabPanel />);
    });

    const blocksTab = container.querySelector('button[aria-label="Blocks"]');
    const queueTab = container.querySelector('button[aria-label="Queue"]');
    expect(blocksTab).not.toBeNull();
    expect(queueTab).not.toBeNull();

    act(() => {
      blocksTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('MOBILE_BLOCKLY_PANEL');
    expect(container.textContent).not.toContain('MOBILE_COMMAND_QUEUE');

    act(() => {
      queueTab?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    expect(container.textContent).toContain('MOBILE_COMMAND_QUEUE');
    expect(container.textContent).not.toContain('MOBILE_BLOCKLY_PANEL');
  });
});
