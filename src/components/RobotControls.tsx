'use client';

import { useEffect } from 'react';
import { useSimulatorStore } from '@/sim/robotController';

export default function RobotControls() {
  const store = useSimulatorStore();
  const robot = useSimulatorStore((s) => s.robot);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);

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

  const statusText = robot.health === 'reached_target'
    ? '🎯 Target reached!'
    : robot.health === 'hit_obstacle'
    ? '💥 Hit an obstacle!'
    : '🤖 Ready';

  const statusColor = robot.health === 'reached_target'
    ? 'text-green-400'
    : robot.health === 'hit_obstacle'
    ? 'text-red-400'
    : 'text-slate-300';

  return (
    <div className="flex flex-col gap-3">
      {/* Status */}
      <div className={`text-sm font-semibold ${statusColor} bg-slate-800 rounded px-3 py-2`}>
        {statusText}
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
          disabled={robot.isRunningQueue || commandQueue.length === 0}
          className="btn-green flex-1"
        >
          ▶ Play Queue
        </button>
        <button
          onClick={store.pauseRobot}
          disabled={!robot.isRunningQueue}
          className="btn-yellow flex-1"
        >
          {robot.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={store.stopRobot}
          disabled={!robot.isRunningQueue}
          className="btn-red flex-1"
        >
          ■ Stop
        </button>
      </div>

      <p className="text-xs text-slate-500">Keyboard: ↑↓←→ arrow keys</p>
    </div>
  );
}
