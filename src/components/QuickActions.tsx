'use client';

import { useSimulatorStore } from '@/sim/robotController';

export default function QuickActions() {
  const activeLesson     = useSimulatorStore((s) => s.activeLesson);
  const activeScenarioId = useSimulatorStore((s) => s.activeScenarioId);
  const loadScenario     = useSimulatorStore((s) => s.loadScenario);
  const restartLesson    = useSimulatorStore((s) => s.restartLesson);
  const replayFromStart  = useSimulatorStore((s) => s.replayFromStart);
  const commandQueue     = useSimulatorStore((s) => s.commandQueue);
  const queueEverCompleted = useSimulatorStore((s) => s.queueEverCompleted);

  const isFreePlay = activeLesson === null;
  const hasQueue   = commandQueue.length > 0;
  const canReplay = hasQueue && queueEverCompleted;

  if (isFreePlay) {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Quick Actions</span>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => activeScenarioId && loadScenario(activeScenarioId)}
            disabled={!activeScenarioId}
            className="btn-small disabled:opacity-40"
            title={activeScenarioId ? 'Reset robot pose, queue, and feedback' : 'No scenario selected'}
          >
            🔄 Reset
          </button>
          <button
            onClick={replayFromStart}
            disabled={!activeScenarioId || !canReplay}
            className="btn-small disabled:opacity-40 disabled:cursor-not-allowed"
            title={
              !activeScenarioId
                ? 'No scenario selected'
                : !hasQueue
                ? 'Add commands to the queue first'
                : !queueEverCompleted
                ? 'Run the queue once to enable Replay.'
                : 'Reset robot to start pose and replay the queue'
            }
          >
            ↩ Replay
          </button>
          <button
            onClick={() => loadScenario('default-arena')}
            disabled={activeScenarioId === 'default-arena'}
            className="btn-small disabled:opacity-40"
            title={activeScenarioId === 'default-arena' ? 'Already on default arena' : 'Back to Default Arena'}
          >
            🏠 Default
          </button>
        </div>
        {!canReplay && activeScenarioId && (
          <p className="text-[10px] text-slate-600 italic mt-0.5">
            Run the queue once to enable Replay.
          </p>
        )}
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
          title="Restart lesson: resets robot, queue, and feedback"
        >
          🔄 Restart
        </button>
        <button
          onClick={replayFromStart}
          disabled={!activeLesson || !canReplay}
          className="btn-small disabled:opacity-40 disabled:cursor-not-allowed"
          title={!hasQueue ? 'Add commands to the queue first' : !queueEverCompleted ? 'Run the queue once to enable Replay.' : 'Reset robot to lesson start pose and replay the queue'}
        >
          ↩ Replay
        </button>
      </div>
      {!canReplay && activeLesson && (
        <p className="text-[10px] text-slate-600 italic mt-0.5">
          Run the queue once to enable Replay.
        </p>
      )}
    </div>
  );
}
