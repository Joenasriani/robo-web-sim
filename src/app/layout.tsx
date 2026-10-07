import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://robo-web-sim.vercel.app'),
  title: {
    default: 'RoboWebSim | 3D Robotics Learning Simulator',
    template: '%s | RoboWebSim',
  },
  description:
    'Program a robot with Blockly, run command queues, edit 3D arenas, use virtual sensors and complete robotics lessons directly in the browser.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'RoboWebSim | 3D Robotics Learning Simulator',
    description:
      'Program a robot with Blockly, run command queues, edit 3D arenas, use virtual sensors and complete robotics lessons directly in the browser.',
    url: '/',
    siteName: 'RoboWebSim',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'RoboWebSim | 3D Robotics Learning Simulator',
    description:
      'Program a robot with Blockly, run command queues, edit 3D arenas, use virtual sensors and complete robotics lessons directly in the browser.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
