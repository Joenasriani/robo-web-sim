import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RoboWebSim — Browser-Based Robotics Simulator',
  description: 'A beginner-friendly browser-based robotics simulator for learning robot movement, navigation, and autonomous behavior.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
