'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useSimulatorStore } from '@/sim/robotController';
import { convertBlockTypesToCommands } from '@/sim/blocklyConverter';
import { CommandType } from '@/sim/commandExecution';
import BlocklyWorkspace, {
  type BlocklyWorkspaceApi,
  type BlocklyWorkspaceDiagnostics,
  BLOCK_DEFINITIONS,
} from './BlocklyWorkspace';

interface BlocklyPanelProps {
  showHeader?: boolean;
  showQuickAdd?: boolean;
  className?: string;
  prioritizeWorkspace?: boolean;
}

export const APPEND_BLOCKLY_COMMAND_EVENT = 'robo-web-sim:append-blockly-command';

const BLOCK_TYPE_TO_COMMAND: Record<string, CommandType> = {
  robot_forward:    'forward',
  robot_backward:   'backward',
  robot_turn_left:  'left',
  robot_turn_right: 'right',
  robot_wait:       'wait',
};

const BLOCK_ICON: Record<string, string> = {
  robot_forward: '↑', robot_backward: '↓',
  robot_turn_left: '↺', robot_turn_right: '↻', robot_wait: '⏸',
};

const BLOCK_COLOR: Record<string, string> = {
  robot_forward:    'bg-emerald-800/70 hover:bg-emerald-700/80 border-emerald-600/50 text-emerald-200',
  robot_backward:   'bg-sky-800/70 hover:bg-sky-700/80 border-sky-600/50 text-sky-200',
  robot_turn_left:  'bg-violet-800/70 hover:bg-violet-700/80 border-violet-600/50 text-violet-200',
  robot_turn_right: 'bg-violet-800/70 hover:bg-violet-700/80 border-violet-600/50 text-violet-200',
  robot_wait:       'bg-amber-800/70 hover:bg-amber-700/80 border-amber-600/50 text-amber-200',
};
const WORKSPACE_READY_TIMEOUT_MS = 5000;
const WORKSPACE_QUEUE_SYNC_INTERVAL_MS = 120;
const PRIORITIZED_WORKSPACE_FRAME_CLASS = 'h-[460px] min-h-[420px] lg:h-[52vh] lg:min-h-[460px]';
const DEFAULT_WORKSPACE_FRAME_CLASS = 'h-[360px] min-h-[320px] sm:h-[400px]';

export default function BlocklyPanel({
  showHeader = true,
  showQuickAdd = true,
  className = '',
  prioritizeWorkspace = false,
}: BlocklyPanelProps) {
  const addCommand = useSimulatorStore((s) => s.addCommand);
  const clearQueue = useSimulatorStore((s) => s.clearQueue);
  const isRunning  = useSimulatorStore((s) => s.robot.isRunningQueue);
  const lastSyncedBlockSignatureRef = useRef('');

  const [workspaceApi, setWorkspaceApi]         = useState<BlocklyWorkspaceApi | null>(null);
  const [isWorkspaceReady, setIsWorkspaceReady] = useState(false);
  const [feedback, setFeedback]                 = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [workspaceInitError, setWorkspaceInitError] = useState<string | null>(null);
  const [workspaceReadyReason, setWorkspaceReadyReason] = useState('not ready');
  const [workspaceTimeoutElapsed, setWorkspaceTimeoutElapsed] = useState(false);
  const [workspaceMountNonce, setWorkspaceMountNonce] = useState(0);
  const [workspaceDiagnostics, setWorkspaceDiagnostics] = useState<BlocklyWorkspaceDiagnostics>({
    initStarted: false,
    mounted: false,
    toolboxLoaded: false,
    blockCount: 0,
    containerReadinessReason: 'not evaluated',
    containerWidth: 0,
    containerHeight: 0,
    initError: '',
    lastInitStep: 'idle',
  });

  const showFeedback = useCallback((type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
  }, []);

  const syncWorkspaceToCommandQueue = useCallback(() => {
    if (!workspaceApi || isRunning) return;

    const blockTypes = workspaceApi.getBlockTypes();
    const blockSignature = blockTypes.join('|');
    if (blockSignature === lastSyncedBlockSignatureRef.current) return;

    lastSyncedBlockSignatureRef.current = blockSignature;
    const { commands, errors } = convertBlockTypesToCommands(blockTypes);

    if (errors.length > 0) {
      console.warn('[BlocklyPanel] Unsupported Blockly blocks while syncing command queue:', errors);
    }

    clearQueue();
    for (const command of commands) {
      addCommand(command);
    }
  }, [addCommand, clearQueue, isRunning, workspaceApi]);

  const appendCommandBlock = useCallback((commandType: CommandType, sourceLabel = 'workspace') => {
    if (isRunning || !isWorkspaceReady || !workspaceApi) return;
    workspaceApi.appendCommandBlock(commandType);
    syncWorkspaceToCommandQueue();
    showFeedback('success', `Added ${commandType} from ${sourceLabel}.`);
  }, [isRunning, isWorkspaceReady, showFeedback, syncWorkspaceToCommandQueue, workspaceApi]);

  const handleQuickAdd = useCallback((blockType: string) => {
    const commandType = BLOCK_TYPE_TO_COMMAND[blockType];
    if (!commandType) return;
    appendCommandBlock(commandType, 'quick-add');
  }, [appendCommandBlock]);

  const handleClearBlocks = useCallback(() => {
    workspaceApi?.clearWorkspace();
    syncWorkspaceToCommandQueue();
    showFeedback('success', 'Cleared all blocks.');
  }, [workspaceApi, showFeedback, syncWorkspaceToCommandQueue]);

  const handleWorkspaceReadyChange = useCallback((ready: boolean) => {
    setIsWorkspaceReady(ready);
    if (ready) {
      setWorkspaceTimeoutElapsed(false);
    }
  }, []);

  const handleWorkspaceReasonChange = useCallback((_ready: boolean, reason: string) => {
    setWorkspaceReadyReason(reason);
  }, []);

  const handleWorkspaceError = useCallback((error: string | null) => {
    setWorkspaceInitError(error);
  }, []);

  const handleWorkspaceDiagnostics = useCallback((diagnostics: BlocklyWorkspaceDiagnostics) => {
    setWorkspaceDiagnostics(diagnostics);
  }, []);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 2200);
    return () => clearTimeout(t);
  }, [feedback]);

  const isDebugQueryEnabled = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const q = new URLSearchParams(window.location.search);
    const value = q.get('blocklyDebug');
    return value === '1' || value === 'true';
  }, []);

  useEffect(() => {
    if (isWorkspaceReady) return;
    const timer = window.setTimeout(() => {
      setWorkspaceTimeoutElapsed(true);
    }, WORKSPACE_READY_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isWorkspaceReady, workspaceMountNonce]);

  useEffect(() => {
    if (!workspaceApi || !isWorkspaceReady || isRunning) return;

    syncWorkspaceToCommandQueue();
    const interval = window.setInterval(syncWorkspaceToCommandQueue, WORKSPACE_QUEUE_SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isRunning, isWorkspaceReady, syncWorkspaceToCommandQueue, workspaceApi]);

  useEffect(() => {
    const handleExternalQuickAdd = (event: Event) => {
      const commandType = (event as CustomEvent<CommandType>).detail;
      if (!commandType) return;
      appendCommandBlock(commandType, 'queue quick-add');
    };

    window.addEventListener(APPEND_BLOCKLY_COMMAND_EVENT, handleExternalQuickAdd);
    return () => window.removeEventListener(APPEND_BLOCKLY_COMMAND_EVENT, handleExternalQuickAdd);
  }, [appendCommandBlock]);

  const hasWorkspaceInitFailure = !isWorkspaceReady && workspaceTimeoutElapsed;
  const shouldShowWorkspaceDebug = process.env.NODE_ENV !== 'production' && (isDebugQueryEnabled || hasWorkspaceInitFailure);
  const workspaceFrameClass = prioritizeWorkspace
    ? PRIORITIZED_WORKSPACE_FRAME_CLASS
    : DEFAULT_WORKSPACE_FRAME_CLASS;

  const handleRetryWorkspace = useCallback(() => {
    setWorkspaceMountNonce((prev) => prev + 1);
    setWorkspaceTimeoutElapsed(false);
    setWorkspaceInitError(null);
    setWorkspaceReadyReason('retry requested');
    setIsWorkspaceReady(false);
    lastSyncedBlockSignatureRef.current = '';
  }, []);

  return (
    <div className={`flex h-full min-h-0 flex-col rounded-lg border border-slate-700 bg-slate-900/40 ${prioritizeWorkspace ? 'p-2.5' : 'p-4'} ${className}`}>  
      {showHeader && (
        <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
          🧩 Block Programming
        </h3>
      )}

      <div className={`flex min-h-0 flex-1 flex-col gap-3 ${prioritizeWorkspace ? 'pb-1' : ''}`}>  

        {/* Single compact 5-column quick-add palette */}
        {showQuickAdd && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Quick-Add</p>
            <div className="grid grid-cols-5 gap-1.5">
              {BLOCK_DEFINITIONS.map((def) => {
                const cmd = BLOCK_TYPE_TO_COMMAND[def.type];
                const label = cmd
                  ? cmd.charAt(0).toUpperCase() + cmd.slice(1)
                  : def.type.replace('robot_', '');
                return (
                  <button
                    key={def.type}
                    onClick={() => handleQuickAdd(def.type)}
                    disabled={isRunning || !isWorkspaceReady}
                    title={
                      !isWorkspaceReady ? 'Block editor is loading…'
                      : isRunning ? 'Stop the queue first'
                      : `Add "${label}" to workspace & queue`
                    }
                    className={`flex flex-col items-center gap-0.5 rounded border px-1 py-1.5 text-center text-[10px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 touch-manipulation select-none ${BLOCK_COLOR[def.type] ?? 'bg-slate-700/70 border-slate-500/50 text-slate-200'}`}
                  >
                    <span className="text-sm leading-none">{BLOCK_ICON[def.type] ?? '🧩'}</span>
                    <span className="text-[9px]">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-1 text-[10px] text-slate-600 italic">
              Or drag from the toolbox on the left of the workspace below.
            </p>
          </div>
        )}

        {/* Blockly Workspace */}
        {isRunning ? (
          <p className="rounded bg-yellow-950/40 px-2 py-1.5 text-xs text-yellow-400">
            ⚠ Stop the queue before editing blocks.
          </p>
        ) : (
          <div className={`relative overflow-hidden ${workspaceFrameClass}`}>
            {!isWorkspaceReady && !hasWorkspaceInitFailure && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded border border-slate-700 bg-slate-900/80">
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-blue-400" />
                  <span className="text-xs">Loading block editor…</span>
                </div>
              </div>
            )}
            {hasWorkspaceInitFailure && (
              <div className="absolute inset-0 z-20 overflow-y-auto rounded border border-rose-700 bg-slate-950/95 p-3 text-xs text-rose-100">
                <p className="font-semibold text-rose-200">⚠ Block editor failed to become ready.</p>
                <p className="mt-1 text-slate-300">The workspace container may still be sizing. You can retry initialization.</p>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                  <div>{`Container: ${Math.round(workspaceDiagnostics.containerWidth)} × ${Math.round(workspaceDiagnostics.containerHeight)}`}</div>
                  <div>{`Readiness: ${workspaceDiagnostics.containerReadinessReason}`}</div>
                  <div>{`Last step: ${workspaceDiagnostics.lastInitStep}`}</div>
                  <div>{`Block count: ${workspaceDiagnostics.blockCount}`}</div>
                  <div>{`Ready state: ${workspaceReadyReason}`}</div>
                  {(workspaceInitError || workspaceDiagnostics.initError) && (
                    <div className="text-rose-300">{`Error: ${workspaceInitError ?? workspaceDiagnostics.initError}`}</div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn-secondary mt-3 text-xs"
                  onClick={handleRetryWorkspace}
                >
                  Retry editor initialization
                </button>
              </div>
            )}
            <BlocklyWorkspace
              key={workspaceMountNonce}
              onWorkspaceApi={setWorkspaceApi}
              onWorkspaceReadyChange={handleWorkspaceReadyChange}
              onReadyChange={handleWorkspaceReasonChange}
              onError={handleWorkspaceError}
              onDiagnostics={handleWorkspaceDiagnostics}
              showDebugPanel={shouldShowWorkspaceDebug}
              className={`h-full w-full ${prioritizeWorkspace ? 'rounded border border-slate-700 bg-slate-900' : ''}`}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleClearBlocks}
            className="btn-secondary text-xs"
            disabled={!isWorkspaceReady || isRunning}
            title="Remove all blocks from the workspace"
          >
            🗑 Clear Blocks
          </button>
        </div>

        {feedback && (
          <p
            className={`shrink-0 rounded px-2 py-1.5 text-xs ${feedback.type === 'success' ? 'bg-green-950/40 text-green-300' : 'bg-red-950/40 text-red-300'}`}
            role="status"
          >
            {feedback.msg}
          </p>
        )}
      </div>
    </div>
  );
}
