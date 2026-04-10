'use client';

import { useEffect, useRef } from 'react';
import { useSimulatorStore } from '@/sim/robotController';

export default function RobotControls() {
  // Select only the individual pieces we need so this component does not
  // rerender on unrelated store changes (e.g. robot position updates while
  // the queue is running).
  const moveForward  = useSimulatorStore((s) => s.moveForward);
  const moveBackward = useSimulatorStore((s) => s.moveBackward);
  const turnLeft     = useSimulatorStore((s) => s.turnLeft);
  const turnRight    = useSimulatorStore((s) => s.turnRight);
  const resetRobot   = useSimulatorStore((s) => s.resetRobot);
  const pauseRobot   = useSimulatorStore((s) => s.pauseRobot);
  const stopRobot    = useSimulatorStore((s) => s.stopRobot);
  const runQueue     = useSimulatorStore((s) => s.runQueue);
  const robot        = useSimulatorStore((s) => s.robot);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);

  // gateRef lets the keyboard handler read the latest guard values without
  // needing to re-register the event listener on every state change.
  const gateRef = useRef({ isRunningQueue: robot.isRunningQueue, isPaused: robot.isPaused });
  gateRef.current = { isRunningQueue: robot.isRunningQueue, isPaused: robot.isPaused };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (gateRef.current.isRunningQueue && !gateRef.current.isPaused) return;
      switch (e.key) {
        case 'ArrowUp':    moveForward();  break;
        case 'ArrowDown':  moveBackward(); break;
        case 'ArrowLeft':  turnLeft();     break;
        case 'ArrowRight': turnRight();    break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  // Zustand action refs are stable — this effect runs once and never re-runs.
  }, [moveForward, moveBackward, turnLeft, turnRight]);

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
          onClick={moveForward}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Move Forward (↑)"
        >
          ↑ Forward
        </button>
        <div />

        <button
          onClick={turnLeft}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Turn Left (←)"
        >
          ← Left
        </button>
        <button
          onClick={resetRobot}
          className="btn-secondary"
          title="Reset"
        >
          ⟳ Reset
        </button>
        <button
          onClick={turnRight}
          disabled={robot.isRunningQueue && !robot.isPaused}
          className="btn-control"
          title="Turn Right (→)"
        >
          Right →
        </button>

        <div />
        <button
          onClick={moveBackward}
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
          onClick={() => runQueue()}
          disabled={robot.isRunningQueue || commandQueue.length === 0}
          className="btn-green flex-1"
        >
          ▶ Play Queue
        </button>
        <button
          onClick={pauseRobot}
          disabled={!robot.isRunningQueue}
          className="btn-yellow flex-1"
        >
          {robot.isPaused ? '▶ Resume' : '⏸ Pause'}
        </button>
        <button
          onClick={stopRobot}
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
