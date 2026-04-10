'use client';

import { useSimulatorStore } from '@/sim/robotController';

export default function QuickActions() {
  const activeLesson     = useSimulatorStore((s) => s.activeLesson);
  const activeScenarioId = useSimulatorStore((s) => s.activeScenarioId);
  const loadScenario     = useSimulatorStore((s) => s.loadScenario);
  const restartLesson    = useSimulatorStore((s) => s.restartLesson);
  const replayFromStart  = useSimulatorStore((s) => s.replayFromStart);
  const commandQueue     = useSimulatorStore((s) => s.commandQueue);

  const isFreePlay = activeLesson === null;
  const hasQueue   = commandQueue.length > 0;

  if (isFreePlay) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Quick Actions</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => activeScenarioId && loadScenario(activeScenarioId)}
            disabled={!activeScenarioId}
            className="btn-small disabled:opacity-40"
            title="Reset current scenario (robot pose, queue, feedback)"
          >
            🔄 Reset
          </button>
          <button
            onClick={replayFromStart}
            disabled={!activeScenarioId || !hasQueue}
            className="btn-small disabled:opacity-40"
            title="Reset robot to start pose and replay the current queue"
          >
            ↩ Replay
          </button>
          <button
            onClick={() => loadScenario('default-arena')}
            disabled={activeScenarioId === 'default-arena'}
            className="btn-small disabled:opacity-40"
            title="Back to Default Arena"
          >
            🏠 Default
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Quick Actions</span>
      <div className="flex flex-wrap gap-1">
        <button
          onClick={restartLesson}
          disabled={!activeLesson}
          className="btn-small disabled:opacity-40"
          title="Restart lesson (resets robot, queue, feedback)"
        >
          🔄 Restart
        </button>
        <button
          onClick={replayFromStart}
          disabled={!activeLesson || !hasQueue}
          className="btn-small disabled:opacity-40"
          title="Reset robot to lesson start pose and replay the current queue"
        >
          ↩ Replay
        </button>
      </div>
    </div>
  );
}
