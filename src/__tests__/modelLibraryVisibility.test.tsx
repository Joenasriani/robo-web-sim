import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const mockStoreState = {
  activeLesson: null as string | null,
  isEditMode: false,
  placementTool: null as { modelId: string; modelName: string } | null,
  selectPlacementTool: jest.fn(),
  clearPlacementTool: jest.fn(),
};

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

describe('ModelLibrary visibility', () => {
  beforeEach(() => {
    mockStoreState.activeLesson = null;
    mockStoreState.isEditMode = false;
    mockStoreState.placementTool = null;
    mockStoreState.selectPlacementTool = jest.fn();
    mockStoreState.clearPlacementTool = jest.fn();
  });

  it('is hidden during lessons when not in edit mode', async () => {
    mockStoreState.activeLesson = 'lesson-1';
    const { default: ModelLibrary } = await import('@/components/ModelLibrary');
    const html = renderToStaticMarkup(<ModelLibrary />);

    expect(html).toBe('');
  });

  it('renders during lessons in edit mode', async () => {
    mockStoreState.activeLesson = 'lesson-1';
    mockStoreState.isEditMode = true;
    const { default: ModelLibrary } = await import('@/components/ModelLibrary');
    const html = renderToStaticMarkup(<ModelLibrary />);

    expect(html).toContain('Assets');
    expect(html).toContain('Red Crate');
    expect(html).toContain('Select assets as placement tools for Edit Mode.');
  });
});
