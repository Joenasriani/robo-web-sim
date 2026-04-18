'use client';

import { useState } from 'react';

const DISMISS_KEY = 'robo-web-sim-onboarding-dismissed';

const STEPS = ['Pick a lesson', 'Add commands', 'Run queue'];

/**
 * A compact, dismissible beginner hint strip shown at the top of the simulator.
 * Dismissal is stored in sessionStorage so it reappears on each new browser session
 * (good for demos) but stays hidden within a session once closed.
 */
export default function OnboardingStrip() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem(DISMISS_KEY);
  });
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    setExpanded(false);
  };

  return (
    <div
      role="note"
      aria-label="Quick start guide"
      className="shrink-0 bg-blue-950/60 border-b border-blue-900/60 px-3 py-1.5 text-xs"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-label="Toggle quick start steps"
          className="text-left text-blue-300 font-semibold whitespace-nowrap shrink-0 hover:text-blue-200 transition-colors"
        >
          💡 Quick Start
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss quick start guide"
          className="ml-auto shrink-0 text-blue-400 hover:text-white transition-colors text-sm leading-none touch-manipulation"
          title="Dismiss"
        >
          ✕
        </button>
      </div>
      {expanded && (
        <ol className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-blue-200/85" aria-label="Quick start steps">
          {STEPS.map((step, i) => (
            <li key={step} className="whitespace-nowrap">
              {i + 1}. {step}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
