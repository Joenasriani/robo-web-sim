import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import BlocklyPanel from '@/components/BlocklyPanel';

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

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

describe('BlocklyPanel default state', () => {
  beforeEach(() => {
    mockStoreState.addCommand = jest.fn();
    mockStoreState.robot = { isRunningQueue: false };
  });

  it('starts collapsed by default', () => {
    const html = renderToStaticMarkup(<BlocklyPanel />);

    expect(html).toContain('🧩 Block Programming');
    expect(html).toContain('▼ Show');
    expect(html).toContain('aria-expanded="false"');
  });
});
