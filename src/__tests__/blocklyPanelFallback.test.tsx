import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import BlocklyPanel from '@/components/BlocklyPanel';

const mockStoreState = {
  addCommand: jest.fn(),
  robot: { isRunningQueue: false },
};

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

jest.mock('@/components/BlocklyWorkspace', () => ({
  __esModule: true,
  default: function BlocklyWorkspaceMock(props: {
    onWorkspaceReadyChange?: (ready: boolean) => void;
    onReadyChange?: (ready: boolean, reason: string) => void;
    onError?: (error: string | null) => void;
    onDiagnostics?: (diagnostics: {
      containerWidth: number;
      containerHeight: number;
      containerReadinessReason: string;
      lastInitStep: string;
      blockCount: number;
      initError: string;
      initStarted: boolean;
      mounted: boolean;
      toolboxLoaded: boolean;
    }) => void;
  }) {
    React.useEffect(() => {
      props.onWorkspaceReadyChange?.(false);
      props.onReadyChange?.(false, 'container has zero size');
      props.onError?.('inject timeout');
      props.onDiagnostics?.({
        initStarted: true,
        mounted: false,
        toolboxLoaded: false,
        blockCount: 0,
        containerReadinessReason: 'container has zero size',
        containerWidth: 0,
        containerHeight: 0,
        initError: 'inject timeout',
        lastInitStep: 'initialization failed',
      });
      // This mock intentionally emits a single failed lifecycle snapshot on mount.
      // Re-running it on every render would create a feedback loop that doesn't model
      // the real integration point for this test ("never became ready within timeout").
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <div>MOCK_BLOCKLY_WORKSPACE</div>;
  },
  BLOCK_DEFINITIONS: [
    { type: 'robot_forward' },
    { type: 'robot_backward' },
    { type: 'robot_turn_left' },
    { type: 'robot_turn_right' },
    { type: 'robot_wait' },
  ],
}));

describe('BlocklyPanel fallback', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.useFakeTimers();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('shows diagnostics fallback if workspace never becomes ready', () => {
    act(() => {
      root.render(<BlocklyPanel />);
    });
    expect(container.textContent).toContain('Loading block editor…');

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(container.textContent).toContain('Block editor failed to become ready');
    expect(container.textContent).toContain('Container: 0 × 0');
    expect(container.textContent).toContain('Readiness: container has zero size');
    expect(container.textContent).toContain('Last step: initialization failed');
    expect(container.textContent).toContain('Error: inject timeout');
    expect(container.textContent).toContain('Retry editor initialization');
  });
});
