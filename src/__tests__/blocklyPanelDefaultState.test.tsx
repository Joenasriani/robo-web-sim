import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BlocklyPanel from '@/components/BlocklyPanel';

const mockStoreState = {
  addCommand: jest.fn(),
  robot: { isRunningQueue: false },
};

jest.mock('@/components/BlocklyWorkspace', () => {
  return function BlocklyWorkspaceMock() {
    return <div>MOCK_BLOCKLY_WORKSPACE</div>;
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
    expect(html).toContain('min-h-[320px]');
    expect(html).toContain('<button disabled="" class="btn-small" title="Block editor is initializing">↑ Forward</button>');
    expect(html).toContain('<button class="btn-green text-xs" title="Add all blocks to the command queue" disabled="">➕ Send to Queue</button>');
    expect(html).toContain('<button class="btn-secondary text-xs" title="Remove all blocks from the workspace" disabled="">🗑 Clear Blocks</button>');
  });
});
