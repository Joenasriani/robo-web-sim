import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BlocklyPanel from '@/components/BlocklyPanel';

const mockStoreState = {
  addCommand: jest.fn(),
  robot: { isRunningQueue: false },
};

jest.mock('@/components/BlocklyWorkspace', () => {
  return {
    __esModule: true,
    default: function BlocklyWorkspaceMock() {
      return <div>MOCK_BLOCKLY_WORKSPACE</div>;
    },
    BLOCK_DEFINITIONS: [
      { type: 'robot_forward' },
      { type: 'robot_backward' },
      { type: 'robot_turn_left' },
      { type: 'robot_turn_right' },
      { type: 'robot_wait' },
    ],
  };
});

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

describe('BlocklyPanel default state', () => {
  beforeEach(() => {
    mockStoreState.addCommand = jest.fn();
    mockStoreState.robot = { isRunningQueue: false };
  });

  it('shows block programming workspace and quick add controls by default', () => {
    const html = renderToStaticMarkup(<BlocklyPanel />);

    expect(html).toContain('🧩 Block Programming');
    expect(html).toContain('Quick-Add');
    expect(html).toContain('↑');
    expect(html).toContain('Forward');
    expect(html).toContain('⏸');
    expect(html).toContain('Wait');
    expect(html).toContain('MOCK_BLOCKLY_WORKSPACE');
    expect(html).toContain('Loading block editor…');
    expect(html).toContain('Or drag from the toolbox on the left of the workspace below.');
    expect(html).toContain('min-h-[320px]');
    expect(html).toContain('title="Block editor is loading…"');
    expect(html).not.toContain('➕ Send to Queue');
    expect(html).toContain('<button class="btn-secondary text-xs" disabled="" title="Remove all blocks from the workspace">🗑 Clear Blocks</button>');
  });
});
