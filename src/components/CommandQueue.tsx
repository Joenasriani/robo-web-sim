'use client';

import { useSimulatorStore } from '@/sim/robotController';
import { CommandType } from '@/sim/commandExecution';

const COMMAND_BUTTONS: { type: CommandType; label: string; icon: string }[] = [
  { type: 'forward', label: 'Forward', icon: '↑' },
  { type: 'backward', label: 'Backward', icon: '↓' },
  { type: 'left', label: 'Turn Left', icon: '←' },
  { type: 'right', label: 'Turn Right', icon: '→' },
  { type: 'wait', label: 'Wait', icon: '⏸' },
];

export default function CommandQueue() {
  const addCommand = useSimulatorStore((s) => s.addCommand);
  const removeLastCommand = useSimulatorStore((s) => s.removeLastCommand);
  const clearQueue = useSimulatorStore((s) => s.clearQueue);
  const commandQueue = useSimulatorStore((s) => s.commandQueue);
  const currentIndex = useSimulatorStore((s) => s.currentCommandIndex);
  const runQueue = useSimulatorStore((s) => s.runQueue);
  const isRunning = useSimulatorStore((s) => s.robot.isRunningQueue);

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Command Builder</h3>

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2">
        {COMMAND_BUTTONS.map((btn) => (
          <button
            key={btn.type}
            onClick={() => addCommand(btn.type)}
            className="btn-small"
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Queue list */}
      <div className="bg-slate-900 rounded-lg p-2 min-h-[80px] max-h-[160px] overflow-y-auto">
        {commandQueue.length === 0 ? (
          <p className="text-xs text-slate-500 text-center mt-4">No commands queued yet</p>
        ) : (
          <ol className="space-y-1">
            {commandQueue.map((cmd, i) => (
              <li
                key={cmd.id}
                className={`text-xs px-2 py-1 rounded flex items-center gap-2 transition-colors ${
                  i === currentIndex
                    ? 'bg-blue-600 text-white font-bold'
                    : i < (currentIndex ?? -1)
                    ? 'bg-slate-700 text-slate-400 line-through'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                <span className="w-4 text-right text-slate-500">{i + 1}.</span>
                {cmd.label}
                {i === currentIndex && <span className="ml-auto">▶</span>}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Queue controls */}
      <div className="flex gap-2">
        <button
          onClick={() => runQueue()}
          disabled={isRunning || commandQueue.length === 0}
          className="btn-green flex-1 text-xs"
        >
          ▶ Run Queue
        </button>
        <button
          onClick={removeLastCommand}
          disabled={isRunning || commandQueue.length === 0}
          className="btn-secondary text-xs"
        >
          ✕ Remove Last
        </button>
        <button
          onClick={clearQueue}
          disabled={isRunning}
          className="btn-secondary text-xs"
        >
          🗑 Clear
        </button>
      </div>
    </div>
  );
}
