import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Robot Simulator — Free Tool | RoboMarket.ae',
  description: 'A free browser-based robotics simulator. Learn robot navigation, command queuing, and sensor-guided movement — no installation required. Brought to you by RoboMarket.ae.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
