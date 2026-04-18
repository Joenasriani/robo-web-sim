'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSimulatorStore } from '@/sim/robotController';
import { convertBlockTypesToCommands } from '@/sim/blocklyConverter';

// Dynamic import: Blockly manipulates the DOM and must not run on the server.
const BlocklyWorkspace = dynamic(() => import('./BlocklyWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] flex items-center justify-center bg-slate-900 rounded border border-slate-700">
      <span className="text-xs text-slate-500">Loading block editor…</span>
    </div>
  ),
});

interface BlocklyPanelProps {
  onExpandedChange?: (expanded: boolean) => void;
  workspaceHeight?: number;
}

/**
 * Collapsible panel that exposes a Blockly visual programming workspace.
 * When the user clicks "Send to Queue", the blocks are converted to robot
 * commands and appended to the existing command queue.
 */
export default function BlocklyPanel({ onExpandedChange, workspaceHeight = 280 }: BlocklyPanelProps) {
  const addCommand  = useSimulatorStore((s) => s.addCommand);
  const isRunning   = useSimulatorStore((s) => s.robot.isRunningQueue);

  const [expanded, setExpanded]   = useState(false);
  const [feedback, setFeedback]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    onExpandedChange?.(expanded);
  }, [expanded, onExpandedChange]);

  const handleSendToQueue = useCallback(
    (blockTypes: string[]) => {
      setFeedback(null);

      if (blockTypes.length === 0) {
        setFeedback({ type: 'error', msg: 'Workspace is empty — drag some blocks first.' });
        return;
      }

      const { commands, errors } = convertBlockTypesToCommands(blockTypes);

      if (errors.length > 0) {
        setFeedback({ type: 'error', msg: `Unsupported blocks found: ${errors.join(', ')}` });
        return;
      }

      if (commands.length === 0) {
        setFeedback({ type: 'error', msg: 'No valid commands were generated.' });
        return;
      }

      for (const cmd of commands) {
        addCommand(cmd);
      }

      setFeedback({
        type: 'success',
        msg: `Added ${commands.length} command${commands.length !== 1 ? 's' : ''} to the queue.`,
      });
    },
    [addCommand],
  );

  return (
    <div className="flex flex-col gap-2">
      {/* Panel header with expand / collapse toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
          🧩 Block Programming
        </h3>
        <button
          onClick={() => { setExpanded((e) => !e); setFeedback(null); }}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse block programming panel' : 'Expand block programming panel'}
        >
          {expanded ? '▲ Hide' : '▼ Show'}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Drag command blocks into the workspace to build a program, then click{' '}
            <strong className="text-slate-300">Send to Queue</strong> to append them.
          </p>

          {isRunning ? (
            /* Prevent accidental queue modification while executing */
            <p className="text-xs text-yellow-400 bg-yellow-950/40 px-2 py-1.5 rounded">
              ⚠ Stop the queue before sending new commands.
            </p>
          ) : (
            <BlocklyWorkspace onSendToQueue={handleSendToQueue} workspaceHeight={workspaceHeight} />
          )}

          {feedback && (
            <p
              className={`text-xs px-2 py-1.5 rounded ${
                feedback.type === 'success'
                  ? 'text-green-300 bg-green-950/40'
                  : 'text-red-300 bg-red-950/40'
              }`}
              role="status"
            >
              {feedback.msg}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
