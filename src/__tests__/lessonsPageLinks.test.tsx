import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LessonsPage from '@/app/lessons/page';

const mockStoreState = {
  completedLessons: [],
  resetLessonProgress: jest.fn(),
};

jest.mock('next/link', () => {
  return function LinkMock({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('@/sim/robotController', () => ({
  useSimulatorStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}));

describe('LessonsPage deep links', () => {
  it('links all lesson cards to /simulator?lesson=N', () => {
    const html = renderToStaticMarkup(<LessonsPage />);
    for (let i = 1; i <= 8; i += 1) {
      expect(html).toContain(`href="/simulator?lesson=${i}"`);
    }
  });
});
