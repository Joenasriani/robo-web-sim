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
    <div className="min-h-[360px] flex-1 flex items-center justify-center bg-slate-900 rounded border border-slate-700">
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
  const [feedback, setFeedback]   = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

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

  const handleQuickAdd = useCallback((command: CommandType) => {
    if (isRunning) return;
    addCommand(command);
    workspaceApi?.appendCommandBlock(command);
    setFeedback({ type: 'success', msg: `Added ${command} to queue.` });
  }, [addCommand, isRunning, workspaceApi]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(timeout);
  }, [feedback]);

  return (
    <div className={`flex h-full min-h-0 flex-col gap-2 ${className}`}>
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            🧩 Block Programming
          </h3>
          <span className="text-xs text-slate-400">Drag blocks to build</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
        <p className="text-xs text-yellow-400 bg-yellow-950/40 px-2 py-1.5 rounded">
          ⚠ Stop the queue before editing blocks.
        </p>
      ) : (
        <BlocklyWorkspace onSendToQueue={handleSendToQueue} onWorkspaceApi={setWorkspaceApi} />
      )}

      {feedback && (
        <p
          className={`text-xs px-2 py-1.5 rounded shrink-0 ${
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
  );
}
