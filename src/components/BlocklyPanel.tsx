'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSimulatorStore } from '@/sim/robotController';
import { convertBlockTypesToCommands } from '@/sim/blocklyConverter';
import { CommandType } from '@/sim/commandExecution';
import type { BlocklyWorkspaceApi } from './BlocklyWorkspace';

// Dynamic import: Blockly manipulates the DOM and must not run on the server.
const BlocklyWorkspace = dynamic(() => import('./BlocklyWorkspace'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[260px] flex-1 flex items-center justify-center bg-slate-900 rounded border border-slate-700">
      <span className="text-xs text-slate-500">Loading block editor…</span>
    </div>
  ),
});

interface BlocklyPanelProps {
  showHeader?: boolean;
  className?: string;
}

const QUICK_ADD_BUTTONS: { type: CommandType; label: string; icon: string }[] = [
  { type: 'forward', label: 'Forward', icon: '↑' },
  { type: 'backward', label: 'Backward', icon: '↓' },
  { type: 'left', label: 'Left', icon: '←' },
  { type: 'right', label: 'Right', icon: '→' },
  { type: 'wait', label: 'Wait', icon: '⏸' },
];

/**
 * Collapsible panel that exposes a Blockly visual programming workspace.
 * When the user clicks "Send to Queue", the blocks are converted to robot
 * commands and appended to the existing command queue.
 */
export default function BlocklyPanel({ showHeader = true, className = '' }: BlocklyPanelProps) {
  const addCommand  = useSimulatorStore((s) => s.addCommand);
  const isRunning   = useSimulatorStore((s) => s.robot.isRunningQueue);

  const [workspaceApi, setWorkspaceApi] = useState<BlocklyWorkspaceApi | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [feedback, setFeedback]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleSendToQueue = useCallback(() => {
      const blockTypes = workspaceApi?.getBlockTypes() ?? [];
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
    }, [addCommand, workspaceApi]);

  const handleQuickAdd = useCallback((command: CommandType) => {
    if (isRunning) return;
    addCommand(command);
    workspaceApi?.appendCommandBlock(command);
    setFeedback({ type: 'success', msg: `Added ${command} to queue.` });
  }, [addCommand, isRunning, workspaceApi]);

  const handleClearBlocks = useCallback(() => {
    workspaceApi?.clearWorkspace();
    setFeedback({ type: 'success', msg: 'Cleared all blocks.' });
  }, [workspaceApi]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(timeout);
  }, [feedback]);

  return (
    <div className={`flex min-h-0 flex-col rounded-lg border border-slate-700 bg-slate-900/40 p-4 ${className}`}>
      <div className="flex items-center justify-between">
        {showHeader ? (
          <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-300">
            🧩 Block Programming
          </h3>
        ) : (
          <div />
        )}
        <button
          type="button"
          className="btn-secondary text-xs"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_ADD_BUTTONS.map((btn) => (
              <button
                key={btn.type}
                onClick={() => handleQuickAdd(btn.type)}
                disabled={isRunning}
                className="btn-small"
                title={isRunning ? 'Stop the queue before adding commands' : `Quick add ${btn.label} and mirror it in blocks`}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>

          {isRunning ? (
            <p className="rounded bg-yellow-950/40 px-2 py-1.5 text-xs text-yellow-400">
              ⚠ Stop the queue before editing blocks.
            </p>
          ) : (
            <div className="flex min-h-0 flex-1">
              <BlocklyWorkspace onWorkspaceApi={setWorkspaceApi} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSendToQueue}
              className="btn-green text-xs"
              title="Add all blocks to the command queue"
            >
              ➕ Send to Queue
            </button>
            <button
              onClick={handleClearBlocks}
              className="btn-secondary text-xs"
              title="Remove all blocks from the workspace"
            >
              🗑 Clear Blocks
            </button>
          </div>

          {feedback && (
            <p
              className={`shrink-0 rounded px-2 py-1.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-green-950/40 text-green-300'
                  : 'bg-red-950/40 text-red-300'
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
