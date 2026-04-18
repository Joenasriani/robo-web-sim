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
    ROBOT_BLOCK_PALETTE: [
      { type: 'robot_forward', icon: '↑', label: 'Move Forward' },
      { type: 'robot_backward', icon: '↓', label: 'Move Backward' },
      { type: 'robot_turn_left', icon: '←', label: 'Turn Left' },
      { type: 'robot_turn_right', icon: '→', label: 'Turn Right' },
      { type: 'robot_wait', icon: '⏸', label: 'Wait' },
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
    expect(html).toContain('↑ Forward');
    expect(html).toContain('⏸ Wait');
    expect(html).toContain('MOCK_BLOCKLY_WORKSPACE');
    expect(html).toContain('Initializing Blockly…');
    expect(html).toContain('Quick Add is disabled until the block editor finishes initializing.');
    expect(html).toContain('Block Palette');
    expect(html).toContain('↑ Move Forward');
    expect(html).toContain('min-h-[320px]');
    expect(html).toContain('<button disabled="" class="btn-small" title="Block editor is initializing">↑ Forward</button>');
    expect(html).toContain('<button class="btn-green text-xs" title="Add all blocks to the command queue" disabled="">➕ Send to Queue</button>');
    expect(html).toContain('<button class="btn-secondary text-xs" title="Remove all blocks from the workspace" disabled="">🗑 Clear Blocks</button>');
  });
});
