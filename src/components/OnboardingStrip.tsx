'use client';

import { useEffect, useState } from 'react';

const DISMISS_KEY = 'robo-web-sim-onboarding-dismissed';

const STEPS = [
  { icon: '🗺️', text: 'Pick a scenario or lesson' },
  { icon: '➕', text: 'Add commands to the queue' },
  { icon: '▶', text: 'Run the queue' },
  { icon: '📊', text: 'Watch telemetry & lesson status' },
];

const MOBILE_STEPS = [
  { icon: '🎮', text: 'Tap Controls to move the robot' },
  { icon: '⚡', text: 'Tap Queue to build a program' },
  { icon: '🗺️', text: 'Tap Scenarios to pick a lesson' },
  { icon: '✏️', text: 'Tap Controls → Edit Arena to place objects' },
];

/**
 * A compact, dismissible beginner hint strip shown at the top of the simulator.
 * Dismissal is stored in sessionStorage so it reappears on each new browser session
 * (good for demos) but stays hidden within a session once closed.
 */
export default function OnboardingStrip() {
  const [visible, setVisible] = useState(false);

  // Only read sessionStorage on the client to avoid SSR mismatch
  useEffect(() => {
    const dismissed = sessionStorage.getItem(DISMISS_KEY);
    if (!dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div
      role="note"
      aria-label="Quick start guide"
      className="shrink-0 bg-blue-950/60 border-b border-blue-900/60 px-3 py-1.5 flex items-center gap-3 text-xs overflow-x-auto"
    >
      <span className="text-blue-300 font-semibold whitespace-nowrap shrink-0">💡 Quick start:</span>

      {/* Desktop / tablet steps */}
      <ol className="hidden sm:flex items-center gap-3 min-w-0" aria-label="Steps to use the simulator">
        {STEPS.map((step, i) => (
          <li key={i} className="flex items-center gap-1 whitespace-nowrap text-blue-200/80">
            <span aria-hidden="true" className="text-base leading-none">{step.icon}</span>
            <span>{step.text}</span>
            {i < STEPS.length - 1 && (
              <span aria-hidden="true" className="ml-2 text-blue-700">→</span>
            )}
          </li>
        ))}
      </ol>

      {/* Mobile steps — shown only on small screens */}
      <ol className="flex sm:hidden items-center gap-3 min-w-0" aria-label="Steps to use the simulator on mobile">
        {MOBILE_STEPS.map((step, i) => (
          <li key={i} className="flex items-center gap-1 whitespace-nowrap text-blue-200/80">
            <span aria-hidden="true" className="text-base leading-none">{step.icon}</span>
            <span>{step.text}</span>
            {i < MOBILE_STEPS.length - 1 && (
              <span aria-hidden="true" className="ml-2 text-blue-700">→</span>
            )}
          </li>
        ))}
      </ol>

      <button
        onClick={handleDismiss}
        aria-label="Dismiss quick start guide"
        className="ml-auto shrink-0 text-blue-400 hover:text-white transition-colors text-sm leading-none touch-manipulation"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
