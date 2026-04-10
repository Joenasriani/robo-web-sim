'use client';

import { useSimulatorStore } from '@/sim/robotController';

export default function SimSettings() {
  const simSpeed = useSimulatorStore((s) => s.simSpeed);
  const moveStep = useSimulatorStore((s) => s.moveStep);
  const turnStep = useSimulatorStore((s) => s.turnStep);
  const setSimSpeed = useSimulatorStore((s) => s.setSimSpeed);
  const setMoveStep = useSimulatorStore((s) => s.setMoveStep);
  const setTurnStep = useSimulatorStore((s) => s.setTurnStep);
  const restartLesson = useSimulatorStore((s) => s.restartLesson);
  const restartQueue = useSimulatorStore((s) => s.restartQueue);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);
  const isRunning = useSimulatorStore((s) => s.robot.isRunningQueue);
  const activeLesson = useSimulatorStore((s) => s.activeLesson);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Sim Settings</h3>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">
          Speed: <span className="text-white">{simSpeed}×</span>
        </span>
        <input
          type="range"
          min="0.25"
          max="3"
          step="0.25"
          value={simSpeed}
          onChange={(e) => setSimSpeed(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">
          Step: <span className="text-white">{moveStep.toFixed(2)} m</span>
        </span>
        <input
          type="range"
          min="0.25"
          max="1.5"
          step="0.25"
          value={moveStep}
          onChange={(e) => setMoveStep(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs text-slate-400">
          Turn: <span className="text-white">{Math.round((turnStep * 180) / Math.PI)}°</span>
        </span>
        <input
          type="range"
          min={Math.PI / 12}
          max={Math.PI / 2}
          step={Math.PI / 24}
          value={turnStep}
          onChange={(e) => setTurnStep(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
      </label>

      <div className="flex flex-col gap-1">
        <button
          onClick={restartLesson}
          className="btn-secondary text-xs w-full"
          title={activeLesson ? 'Restart the current lesson' : 'Reset robot pose and clear feedback'}
        >
          🔄 {activeLesson ? 'Reset Lesson' : 'Reset Robot'}
        </button>
        <button
          onClick={restartQueue}
          disabled={isRunning || commandQueue.length === 0}
          className="btn-secondary text-xs w-full"
          title={commandQueue.length === 0 ? 'Add commands first' : isRunning ? 'Stop queue first' : 'Reset robot and replay the queue from the start'}
        >
          ↩ Restart Queue
        </button>
      </div>
    </div>
  );
}
