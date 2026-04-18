import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import OnboardingStrip from '@/components/OnboardingStrip';

describe('OnboardingStrip desktop quick start', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
    sessionStorage.clear();
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

  it('shows desktop quick start steps only after expanding the section', () => {
    act(() => {
      root.render(<OnboardingStrip />);
    });

    expect(container.textContent).toContain('💡 Quick Start');
    expect(container.querySelector('[aria-label="Desktop quick start steps"]')).toBeNull();

    const toggle = container.querySelector('button[aria-label="Toggle quick start steps"]') as HTMLButtonElement;
    expect(toggle).not.toBeNull();

    act(() => {
      toggle.click();
    });

    const desktopSteps = container.querySelector('[aria-label="Quick start steps"]');
    expect(desktopSteps).not.toBeNull();
    expect(desktopSteps?.textContent).toContain('1. Pick a lesson');
    expect(desktopSteps?.textContent).toContain('2. Add commands');
    expect(desktopSteps?.textContent).toContain('3. Play queue');
  });
});
