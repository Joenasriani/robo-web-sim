import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import EditModeBadge from '@/components/EditModeBadge';

const mockStoreState = {
  isEditMode: true,
  placementTool: { modelName: 'Blue Barrel' },
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
