'use client';

import { useSimulatorStore } from '@/sim/robotController';

const TYPE_STYLES = {
  success: 'bg-green-900/90 border-green-500 text-green-200',
  error:   'bg-red-900/90 border-red-500 text-red-200',
  warning: 'bg-yellow-900/90 border-yellow-500 text-yellow-200',
  info:    'bg-blue-900/90 border-blue-500 text-blue-200',
};

export default function SimFeedback() {
  const feedbackMessage = useSimulatorStore((s) => s.feedbackMessage);
  const feedbackType = useSimulatorStore((s) => s.feedbackType);
  const clearFeedback = useSimulatorStore((s) => s.clearFeedback);

  if (!feedbackMessage) return null;

  return (
    <div
      key={feedbackMessage}
      className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-lg border text-sm font-semibold flex items-center gap-3 shadow-lg pointer-events-auto sim-feedback-enter ${TYPE_STYLES[feedbackType]}`}
    >
      <span>{feedbackMessage}</span>
      <button
        onClick={clearFeedback}
        className="opacity-60 hover:opacity-100 text-xs leading-none"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
