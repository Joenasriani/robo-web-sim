import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Simulator',
  description:
    'Program and control a robot in a 3D arena with Blockly, command queues, virtual sensors and arena editing.',
};

export default function SimulatorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
