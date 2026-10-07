import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lessons',
  description:
    'Eight guided RoboWebSim lessons covering movement, turns, command queues, obstacle avoidance and virtual sensor use.',
};

export default function LessonsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
