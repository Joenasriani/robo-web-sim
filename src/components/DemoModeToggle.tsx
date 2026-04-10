'use client';

import { useSimulatorStore } from '@/sim/robotController';

/**
 * Header toggle button that enables/disables Teacher / Demo Mode.
 * Rendered inside the simulator page header.
 */
export default function DemoModeToggle() {
  const demoMode     = useSimulatorStore((s) => s.demoMode);
  const toggleDemo   = useSimulatorStore((s) => s.toggleDemoMode);

  return (
    <button
      onClick={toggleDemo}
      aria-pressed={demoMode}
      title={demoMode ? 'Exit Demo Mode' : 'Enter Teacher / Demo Mode'}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
        demoMode
          ? 'bg-amber-500 text-slate-900 border-amber-400 hover:bg-amber-400'
          : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-white'
      }`}
    >
      <span aria-hidden="true">{demoMode ? '🎓' : '🎓'}</span>
      {demoMode ? 'Exit Demo' : 'Demo Mode'}
    </button>
  );
}
