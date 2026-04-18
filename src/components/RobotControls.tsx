'use client';

import { useEffect } from 'react';
import { useSimulatorStore } from '@/sim/robotController';

/** Derived UI state for queue controls (Play/Pause/Stop). */
export interface QueueControlUiState {
  canPlay: boolean;
  canPauseToggle: boolean;
  canStop: boolean;
  /** Toggle label: Pause while running, Resume while paused. */
  pauseLabel: '⏸ Pause' | '▶ Resume';
  /** Tooltip text for Play Queue button. */
  playTitle: string;
  /** Tooltip text for Pause/Resume button. */
  pauseTitle: string;
  /** Tooltip text for Stop button. */
  stopTitle: string;
  /** Inline status text shown beneath queue controls. */
  helperText: string;
}

/** Compute queue-control enable/disable state and user-facing helper copy. */
export function getQueueControlUiState(args: {
  simState: string;
  queueLength: number;
  isRunningQueue: boolean;
  isPaused: boolean;
}): QueueControlUiState {
  const { simState, queueLength, isRunningQueue, isPaused } = args;
  const hasQueue = queueLength > 0;
  const isQueuePaused = isRunningQueue && isPaused;
  const isQueueRunning = isRunningQueue && !isPaused;

  const canPlay = hasQueue && !isRunningQueue;
  const canPauseToggle = isRunningQueue;
  const canStop = isRunningQueue;

  const playTitle = !hasQueue
    ? 'Queue is empty — add actions first'
    : isRunningQueue
    ? 'Queue is already running'
    : 'Run the command queue';

  const pauseTitle = !isRunningQueue
    ? 'Queue is not running'
    : isQueuePaused
    ? 'Resume queue execution'
    : 'Pause queue execution';

  const stopTitle = canStop ? 'Stop and reset queue to idle' : 'Queue is not running';

  const helperText = !hasQueue
    ? 'Queue is empty — add actions first.'
    : isQueueRunning
    ? 'Queue is running — use Pause or Stop.'
    : isQueuePaused
    ? 'Queue is paused — click Resume or Stop.'
    : simState === 'blocked'
    ? 'Blocked by obstacle. Press Play to retry or Reset to reposition.'
    : simState === 'completed'
    ? 'Target reached. Press Play to run again, or Reset to start over.'
    : '1) Add items to queue 2) Play Queue 3) Pause/Resume 4) Stop to reset.';

  return {
    canPlay,
    canPauseToggle,
    canStop,
    pauseLabel: isQueuePaused ? '▶ Resume' : '⏸ Pause',
    playTitle,
    pauseTitle,
    stopTitle,
    helperText,
  };
}

interface RobotControlsProps {
  showMovementControls?: boolean;
  showQueueControls?: boolean;
}

export default function RobotControls({
  showMovementControls = true,
  showQueueControls = true,
}: RobotControlsProps = {}) {
  const moveForward = useSimulatorStore((s) => s.moveForward);
  const moveBackward = useSimulatorStore((s) => s.moveBackward);
  const turnLeft = useSimulatorStore((s) => s.turnLeft);
  const turnRight = useSimulatorStore((s) => s.turnRight);
  const resetRobot = useSimulatorStore((s) => s.resetRobot);
  const runQueue = useSimulatorStore((s) => s.runQueue);
  const pauseRobot = useSimulatorStore((s) => s.pauseRobot);
  const stopRobot = useSimulatorStore((s) => s.stopRobot);
  const robot = useSimulatorStore((s) => s.robot);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);
  const simState = useSimulatorStore((s) => s.simState);

  useEffect(() => {
    if (!showMovementControls) return;
    const handleKey = (e: KeyboardEvent) => {
      if (robot.isRunningQueue && !robot.isPaused) return;
      if (robot.health === 'hit_obstacle') return;
      switch (e.key) {
        case 'ArrowUp': moveForward(); break;
        case 'ArrowDown': moveBackward(); break;
        case 'ArrowLeft': turnLeft(); break;
        case 'ArrowRight': turnRight(); break;
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveForward, moveBackward, turnLeft, turnRight, robot.isRunningQueue, robot.isPaused, robot.health, showMovementControls]);

  const queueUi = getQueueControlUiState({
    simState,
    queueLength: commandQueue.length,
    isRunningQueue: robot.isRunningQueue,
    isPaused: robot.isPaused,
  });

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

      {showMovementControls && (
        <>
          {/* Movement controls */}
          <div className="grid grid-cols-3 gap-2">
            <div />
            <button
              onClick={moveForward}
              disabled={robot.isRunningQueue && !robot.isPaused}
              className="btn-control"
              aria-label="Move Forward"
              title="Move Forward (↑)"
            >
              ↑ Forward
            </button>
            <div />

            <button
              onClick={turnLeft}
              disabled={robot.isRunningQueue && !robot.isPaused}
              className="btn-control"
              aria-label="Turn Left"
              title="Turn Left (←)"
            >
              ← Left
            </button>
            <button
              onClick={resetRobot}
              className="btn-secondary"
              aria-label="Reset Robot"
              title="Reset"
            >
              ⟳ Reset
            </button>
            <button
              onClick={turnRight}
              disabled={robot.isRunningQueue && !robot.isPaused}
              className="btn-control"
              aria-label="Turn Right"
              title="Turn Right (→)"
            >
              Right →
            </button>

            <div />
            <button
              onClick={moveBackward}
              disabled={robot.isRunningQueue && !robot.isPaused}
              className="btn-control"
              aria-label="Move Backward"
              title="Move Backward (↓)"
            >
              ↓ Back
            </button>
            <div />
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
        </>
      )}

      {showQueueControls && (
        <>
          {/* Play/Pause/Stop row */}
          <div className="flex gap-2">
            <button
              onClick={() => runQueue()}
              disabled={!queueUi.canPlay}
              className="btn-green flex-1"
              aria-label="Play Queue"
              title={queueUi.playTitle}
            >
              ▶ Play Queue
            </button>

            <button
              onClick={pauseRobot}
              disabled={!queueUi.canPauseToggle}
              className="btn-yellow flex-1"
              aria-label={queueUi.pauseLabel === '▶ Resume' ? 'Resume Queue' : 'Pause Queue'}
              title={queueUi.pauseTitle}
            >
              {queueUi.pauseLabel}
            </button>

            <button
              onClick={stopRobot}
              disabled={!queueUi.canStop}
              className="btn-red flex-1"
              aria-label="Stop Queue"
              title={queueUi.stopTitle}
            >
              ■ Stop
            </button>
          </div>
          <div role="status" aria-live="polite" className="text-xs text-slate-500">
            {queueUi.helperText}
          </div>
        </>
      )}

      {showMovementControls && (
        <details className="text-xs text-slate-500 mt-1">
          <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
            ℹ️ Button guide
          </summary>
          <ul className="mt-1 space-y-0.5 text-slate-500 pl-2">
            <li><span className="text-green-400">▶ Play Queue</span> — runs all queued commands in order</li>
            <li><span className="text-yellow-400">⏸ Pause</span> — freezes the queue mid-run (resume it after)</li>
            <li><span className="text-yellow-400">▶ Resume</span> — continues from where it paused</li>
            <li><span className="text-red-400">■ Stop</span> — cancels the queue and returns controls to idle</li>
            <li><span className="text-slate-300">⟳ Reset</span> — returns robot to start position; keeps your queue</li>
            <li><span className="text-slate-300">↩ Replay</span> — resets robot then immediately re-runs queue (in Quick Actions)</li>
          </ul>
        </details>
      )}
    </div>
  );
}
