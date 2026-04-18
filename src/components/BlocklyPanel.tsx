'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import { convertBlockTypesToCommands } from '@/sim/blocklyConverter';
import { CommandType } from '@/sim/commandExecution';
import BlocklyWorkspace, { ROBOT_BLOCK_PALETTE, type BlocklyWorkspaceApi } from './BlocklyWorkspace';

interface BlocklyPanelProps {
  showHeader?: boolean;
  className?: string;
  prioritizeWorkspace?: boolean;
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
export default function BlocklyPanel({
  showHeader = true,
  className = '',
  prioritizeWorkspace = false,
}: BlocklyPanelProps) {
  const addCommand  = useSimulatorStore((s) => s.addCommand);
  const isRunning   = useSimulatorStore((s) => s.robot.isRunningQueue);

  const [workspaceApi, setWorkspaceApi] = useState<BlocklyWorkspaceApi | null>(null);
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
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

  const workspaceInitializing = !isWorkspaceReady && !isRunning;
  const showDebugPanel = useMemo(() => {
    if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
      return false;
    }
    const debugParam = new URLSearchParams(window.location.search).get('blocklyDebug');
    return debugParam === '1' || debugParam === 'true';
  }, []);

  return (
    <div className={`flex h-full min-h-0 flex-col rounded-lg border border-slate-700 bg-slate-900/40 ${prioritizeWorkspace ? 'p-2.5' : 'p-4'} ${className}`}>
      <div className="flex items-center justify-between">
        {showHeader ? (
          <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-300">
            🧩 Block Programming
          </h3>
        ) : (
          <div />
        )}
      </div>

      <div className={`mt-3 flex min-h-0 flex-1 flex-col gap-3 ${prioritizeWorkspace ? 'pb-1' : ''}`}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {QUICK_ADD_BUTTONS.map((btn) => (
            <button
              key={btn.type}
              onClick={() => handleQuickAdd(btn.type)}
              disabled={isRunning || !isWorkspaceReady}
              className="btn-small"
              title={
                !isWorkspaceReady
                  ? 'Block editor is initializing'
                  : isRunning
                    ? 'Stop the queue before adding commands'
                    : `Quick add ${btn.label} and mirror it in blocks`
              }
            >
              {btn.icon} {btn.label}
            </button>
          ))}
        </div>
        {workspaceInitializing && (
          <p className="rounded border border-slate-700 bg-slate-900/70 px-2 py-1.5 text-xs text-slate-300">
            Quick Add is disabled until the block editor finishes initializing.
          </p>
        )}

        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Block Palette
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ROBOT_BLOCK_PALETTE.map((block) => (
              <button
                key={block.type}
                onClick={() => workspaceApi?.appendBlockType(block.type)}
                disabled={isRunning || !isWorkspaceReady}
                className="btn-small"
                title={
                  !isWorkspaceReady
                    ? 'Block editor is initializing'
                    : isRunning
                      ? 'Stop the queue before editing blocks'
                      : `Add ${block.label} block`
                }
              >
                {block.icon} {block.label}
              </button>
            ))}
          </div>
        </div>

        {isRunning ? (
          <p className="rounded bg-yellow-950/40 px-2 py-1.5 text-xs text-yellow-400">
            ⚠ Stop the queue before editing blocks.
          </p>
        ) : (
          <div className={`relative flex min-h-0 flex-1 items-stretch overflow-hidden ${prioritizeWorkspace ? 'h-[360px] min-h-[360px]' : 'min-h-[320px]'}`}>
            {!isWorkspaceReady && (
              <div className="absolute z-10 m-2 rounded border border-slate-700 bg-slate-900/90 px-2 py-1.5 text-[11px] text-slate-400">
                Initializing Blockly…
              </div>
            )}
            <BlocklyWorkspace
              onWorkspaceApi={setWorkspaceApi}
              onWorkspaceReadyChange={setIsWorkspaceReady}
              className={prioritizeWorkspace ? 'rounded border border-slate-700 bg-slate-900' : ''}
              showDebugPanel={showDebugPanel}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSendToQueue}
            className="btn-green text-xs"
            title="Add all blocks to the command queue"
            disabled={!isWorkspaceReady || isRunning}
          >
            ➕ Send to Queue
          </button>
          <button
            onClick={handleClearBlocks}
            className="btn-secondary text-xs"
            title="Remove all blocks from the workspace"
            disabled={!isWorkspaceReady || isRunning}
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
    </div>
  );
}
