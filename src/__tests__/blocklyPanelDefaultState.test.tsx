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
    expect(html).toContain('➕ Send to Queue');
    expect(html).toContain('🗑 Clear Blocks');
    expect(html).toContain('disabled');
  });
});
