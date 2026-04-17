'use client';

import { useEffect } from 'react';
import { useSimulatorStore } from '@/sim/robotController';

export default function RobotControls() {
  const store = useSimulatorStore();
  const robot = useSimulatorStore((s) => s.robot);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);
  const simState = useSimulatorStore((s) => s.simState);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (robot.isRunningQueue && !robot.isPaused) return;
      if (robot.health === 'hit_obstacle') return;
      switch (e.key) {
        case 'ArrowUp': store.moveForward(); break;
        case 'ArrowDown': store.moveBackward(); break;
        case 'ArrowLeft': store.turnLeft(); break;
        case 'ArrowRight': store.turnRight(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [store, robot.isRunningQueue, robot.isPaused, robot.health]);

  const canPlay = simState === 'idle' && commandQueue.length > 0;
  const canPause = simState === 'running';
  const canResume = simState === 'paused';
  const canStop = simState === 'running' || simState === 'paused';

  const stateLabel: Record<string, string> = {
    idle: 'Ready',
    running: '▶ Running…',
    paused: '⏸ Paused',
    completed: '🎯 Target reached!',
    blocked: '💥 Hit an obstacle!',
  };
  const stateColor: Record<string, string> = {
    idle: 'text-slate-300',
    running: 'text-blue-400',
    paused: 'text-yellow-400',
    completed: 'text-green-400',
    blocked: 'text-red-400',
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Status */}
      <div className={`text-sm font-semibold ${stateColor[simState] ?? 'text-slate-300'} bg-slate-800 rounded px-3 py-2`}>
        {stateLabel[simState] ?? 'Ready'}
      </div>

      {/* Movement controls */}
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button
          onClick={store.moveForward}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Move Forward (↑)"
        >
          ↑ Forward
        </button>
        <div />

        <button
          onClick={store.turnLeft}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Turn Left (←)"
        >
          ← Left
        </button>
        <button
          onClick={store.resetRobot}
          className="btn-secondary"
          title="Reset"
        >
          ⟳ Reset
        </button>
        <button
          onClick={store.turnRight}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Turn Right (→)"
        >
          Right →
        </button>

        <div />
        <button
          onClick={store.moveBackward}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Move Backward (↓)"
        >
          ↓ Back
        </button>
        <div />
      </div>

      {/* Play/Pause/Stop row */}
      <div className="flex gap-2">
        <button
          onClick={() => store.runQueue()}
          disabled={!canPlay}
          className="btn-green flex-1"
          title={
            commandQueue.length === 0
              ? 'Add commands to the queue first'
              : simState === 'blocked'
              ? 'Robot hit an obstacle — click ⟳ Reset first'
              : simState === 'completed'
              ? 'Target reached — click ⟳ Reset to run again'
              : 'Run the command queue'
          }
        >
          ▶ Play Queue
        </button>

        {canResume ? (
          <button
            onClick={store.pauseRobot}
            className="btn-yellow flex-1"
            title="Resume queue execution"
          >
            ▶ Resume
          </button>
        ) : (
          <button
            onClick={store.pauseRobot}
            disabled={!canPause}
            className="btn-yellow flex-1"
            title={canPause ? 'Pause queue execution' : 'Queue is not running'}
          >
            ⏸ Pause
          </button>
        )}

        <button
          onClick={store.stopRobot}
          disabled={!canStop}
          className="btn-red flex-1"
          title={canStop ? 'Stop and cancel the queue' : 'Queue is not running'}
        >
          ■ Stop
        </button>
      </div>

      {simState === 'blocked' && (
        <p className="text-xs text-red-400 text-center">
          💥 Hit an obstacle. Click ⟳ Reset to try again.
        </p>
      )}
      {simState === 'completed' && (
        <p className="text-xs text-green-400 text-center">
          🎯 Target reached! Click ⟳ Reset to run again.
        </p>
      )}

      <p className="text-xs text-slate-500">Keyboard: ↑↓←→ arrow keys</p>

      <details className="text-xs text-slate-500 mt-1">
        <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
          ℹ️ Button guide
        </summary>
        <ul className="mt-1 space-y-0.5 text-slate-500 pl-2">
          <li><span className="text-green-400">▶ Play Queue</span> — runs all queued commands in order</li>
          <li><span className="text-yellow-400">⏸ Pause</span> — freezes the queue mid-run (resume it after)</li>
          <li><span className="text-yellow-400">▶ Resume</span> — continues from where it paused</li>
          <li><span className="text-red-400">■ Stop</span> — cancels the queue entirely; robot stays where it stopped</li>
          <li><span className="text-slate-300">⟳ Reset</span> — returns robot to start position; keeps your queue</li>
          <li><span className="text-slate-300">↩ Replay</span> — resets robot then immediately re-runs queue (in Quick Actions)</li>
        </ul>
      </details>
    </div>
  );
}
