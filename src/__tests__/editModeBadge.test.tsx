import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EditModeBadge from '@/components/EditModeBadge';

const mockStoreState = {
  isEditMode: true,
  placementTool: {
    modelId: 'ml-blue-barrel',
    modelName: 'Blue Barrel',
    size: [0.8, 1.2, 0.8] as [number, number, number],
    color: '#3b82f6',
  },
};

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

describe('EditModeBadge', () => {
  it('shows required edit mode placement messaging', () => {
    const html = renderToStaticMarkup(<EditModeBadge />);
    expect(html).toContain('Edit Mode Active');
    expect(html).toContain('Placing: Blue Barrel');
    expect(html).toContain('Click to place • Esc to cancel');
  });
});
