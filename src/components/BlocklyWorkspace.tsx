'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import type { WorkspaceSvg, Block } from 'blockly';
import type { CommandType } from '@/sim/commandExecution';

/** Colour hue values for each command block. */
const BLOCK_COLOURS = {
  forward:  160,
  backward: 200,
  turn:     280,
  wait:      60,
};

export const BLOCK_DEFINITIONS = [
  {
    type: 'robot_forward',
    icon: '↑',
    label: 'Move Forward',
    message: '↑ Move Forward',
    colour: BLOCK_COLOURS.forward,
    tooltip: 'Move the robot forward one step',
  },
  {
    type: 'robot_backward',
    icon: '↓',
    label: 'Move Backward',
    message: '↓ Move Backward',
    colour: BLOCK_COLOURS.backward,
    tooltip: 'Move the robot backward one step',
  },
  {
    type: 'robot_turn_left',
    icon: '←',
    label: 'Turn Left',
    message: '← Turn Left',
    colour: BLOCK_COLOURS.turn,
    tooltip: 'Rotate the robot 22.5° to the left',
  },
  {
    type: 'robot_turn_right',
    icon: '→',
    label: 'Turn Right',
    message: '→ Turn Right',
    colour: BLOCK_COLOURS.turn,
    tooltip: 'Rotate the robot 22.5° to the right',
  },
  {
    type: 'robot_wait',
    icon: '⏸',
    label: 'Wait',
    message: '⏸ Wait',
    colour: BLOCK_COLOURS.wait,
    tooltip: 'Pause the robot for one step',
  },
];
const KNOWN_BLOCK_TYPES = new Set(BLOCK_DEFINITIONS.map((def) => def.type));

export const ROBOT_BLOCK_PALETTE = BLOCK_DEFINITIONS.map((def) => ({
  type: def.type,
  icon: def.icon,
  label: def.label,
}));

const TOOLBOX = {
  kind: 'flyoutToolbox',
  contents: BLOCK_DEFINITIONS.map((def) => ({ kind: 'block', type: def.type })),
};
const TOOLBOX_SOURCE = 'BlocklyWorkspace TOOLBOX constant';

const WORKSPACE_STORAGE_KEY = 'blockly-workspace-state';
const STARTER_BLOCK_TYPE = (() => {
  const starterType = BLOCK_DEFINITIONS[0]?.type;
  if (!starterType) {
    throw new Error('No Blockly starter block type is configured');
  }
  return starterType;
})();

/** Register custom robot command blocks (idempotent). */
function registerBlocks(Blockly: typeof import('blockly')) {
  for (const def of BLOCK_DEFINITIONS) {
    if (Blockly.Blocks[def.type]) continue;
    const { colour, message, tooltip } = def;
    Blockly.Blocks[def.type] = {
      init(this: Block) {
        this.appendDummyInput().appendField(message);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(colour);
        this.setTooltip(tooltip);
      },
    };
  }
}

export interface BlocklyWorkspaceProps {
  onWorkspaceApi?: (api: BlocklyWorkspaceApi | null) => void;
  onWorkspaceReadyChange?: (ready: boolean) => void;
  onReadyChange?: (ready: boolean, reason: string) => void;
  onError?: (error: string | null) => void;
  onDiagnostics?: (diagnostics: BlocklyWorkspaceDiagnostics) => void;
  className?: string;
  showDebugPanel?: boolean;
}

export interface BlocklyWorkspaceApi {
  appendCommandBlock: (command: CommandType) => void;
  appendBlockType: (blockType: string) => void;
  getBlockTypes: () => string[];
  clearWorkspace: () => void;
}

export interface BlocklyWorkspaceDiagnostics {
  initStarted: boolean;
  mounted: boolean;
  toolboxLoaded: boolean;
  blockCount: number;
  containerReadinessReason: string;
  containerWidth: number;
  containerHeight: number;
  initError: string;
  lastInitStep: string;
}

function appendStarterBlock(workspace: WorkspaceSvg, blockType: string) {
  const starterBlock = workspace.newBlock(blockType);
  starterBlock.initSvg();
  starterBlock.render();
  starterBlock.moveBy(24, 24);
}

/**
 * Renders a Blockly workspace pre-loaded with robot command blocks.
 * The parent can read ordered block type strings through `getBlockTypes()`
 * and append blocks using `appendCommandBlock()`.
 *
 * Must only be rendered on the client (use dynamic import with ssr: false).
 */
export default function BlocklyWorkspace({
  onWorkspaceApi,
  onWorkspaceReadyChange,
  onReadyChange,
  onError,
  onDiagnostics,
  className = '',
  showDebugPanel = false,
}: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const [debugState, setDebugState] = useState({
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

  const updateDebugState = useCallback((next: Partial<typeof debugState>) => {
    setDebugState((prev) => ({ ...prev, ...next }));
  }, []);

  const commandToBlockType = useCallback((command: CommandType): string => {
    switch (command) {
      case 'forward': return 'robot_forward';
      case 'backward': return 'robot_backward';
      case 'left': return 'robot_turn_left';
      case 'right': return 'robot_turn_right';
      case 'wait': return 'robot_wait';
      default:
        console.warn('[BlocklyWorkspace] Unsupported command type:', command);
        return 'robot_wait';
    }
  }, []);

  useEffect(() => {
    onDiagnostics?.(debugState);
  }, [debugState, onDiagnostics]);

  useEffect(() => {
    if (!containerRef.current) {
      console.warn('[BlocklyWorkspace] Cannot initialize Blockly: containerRef.current is null');
      return;
    }

    let disposed = false;
    let BlocklyMod: typeof import('blockly') | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeWorkspace: (() => void) | null = null;
    let resizeFrame: number | null = null;
    let retryTimer: number | null = null;
    let workspaceChangeListener: (() => void) | null = null;
    let initializing = false;
    const container = containerRef.current;

    const getContainerLayoutMetrics = () => {
      const rect = container.getBoundingClientRect();
      return {
        height: rect.height,
        width: rect.width,
      };
    };

    const getContainerReadiness = () => {
      const { height, width } = getContainerLayoutMetrics();
      if (!container.isConnected) {
        return { ready: false as const, reason: 'container is not connected to the DOM', width, height };
      }
      if (height <= 0 || width <= 0) {
        return { ready: false as const, reason: 'container has zero size', width, height };
      }
      const style = window.getComputedStyle(container);
      if (style.display === 'none') {
        return { ready: false as const, reason: 'container display is none', width, height };
      }
      if (style.visibility === 'hidden') {
        return { ready: false as const, reason: 'container visibility is hidden', width, height };
      }
      return { ready: true as const, reason: null, width, height };
    };

    const syncBlockCount = () => {
      const ws = workspaceRef.current;
      updateDebugState({ blockCount: ws ? ws.getAllBlocks(false).length : 0 });
    };

    const disposeWorkspace = () => {
      if (workspaceRef.current) {
        if (
          workspaceChangeListener
          && typeof workspaceRef.current.removeChangeListener === 'function'
        ) {
          workspaceRef.current.removeChangeListener(workspaceChangeListener);
        }
        workspaceChangeListener = null;
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
      onWorkspaceApi?.(null);
      onWorkspaceReadyChange?.(false);
      onReadyChange?.(false, 'workspace disposed');
      updateDebugState({ mounted: false, toolboxLoaded: false, blockCount: 0 });
    };

    resizeWorkspace = () => {
      const ws = workspaceRef.current;
      const mod = BlocklyMod;
      if (!ws || !mod) return;
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
      }
      resizeFrame = requestAnimationFrame(() => {
        const liveWorkspace = workspaceRef.current;
        if (liveWorkspace) {
          const maybeResizableWorkspace = liveWorkspace as WorkspaceSvg & { resize?: () => void };
          maybeResizableWorkspace.resize?.();
          liveWorkspace.resizeContents();
          mod.svgResize(liveWorkspace);
          liveWorkspace.render();
          syncBlockCount();
        }
        resizeFrame = null;
      });
    };

    const tryInitWorkspace = async () => {
      if (disposed || initializing || workspaceRef.current) return;

      const readiness = getContainerReadiness();
      updateDebugState({
        containerReadinessReason: readiness.ready ? 'ready' : readiness.reason ?? 'not ready',
        containerWidth: readiness.width,
        containerHeight: readiness.height,
        lastInitStep: 'container readiness evaluated',
      });
      console.info('[BlocklyWorkspace] Container readiness before init:', readiness);
      if (!readiness.ready) {
        console.info('[BlocklyWorkspace] Skipping init:', readiness.reason);
        onReadyChange?.(false, readiness.reason ?? 'container not ready');
        return;
      }

      initializing = true;
      updateDebugState({ initStarted: true, lastInitStep: 'initialization started' });

      try {
        updateDebugState({ lastInitStep: 'importing blockly module' });
        const mod = BlocklyMod ?? await import('blockly');
        const postImportReadiness = getContainerReadiness();
        updateDebugState({
          containerReadinessReason: postImportReadiness.ready ? 'ready' : postImportReadiness.reason ?? 'not ready',
          containerWidth: postImportReadiness.width,
          containerHeight: postImportReadiness.height,
          lastInitStep: 'post-import readiness check',
        });
        if (disposed || !postImportReadiness.ready) {
          if (!postImportReadiness.ready) {
            console.info('[BlocklyWorkspace] Skipping init after import:', postImportReadiness);
            onReadyChange?.(false, postImportReadiness.reason ?? 'container not ready after import');
          }
          initializing = false;
          return;
        }

        BlocklyMod = mod;
        registerBlocks(mod);
        updateDebugState({ lastInitStep: 'block definitions registered' });

        const registeredTypes = BLOCK_DEFINITIONS.filter((def) => Boolean(mod.Blocks[def.type])).map((def) => def.type);
        console.info('[BlocklyWorkspace] Registered block definitions:', registeredTypes);

        if (
          TOOLBOX.kind !== 'flyoutToolbox'
          || !Array.isArray(TOOLBOX.contents)
          || TOOLBOX.contents.length === 0
        ) {
          throw new Error('Invalid Blockly toolbox configuration');
        }

        console.info('[BlocklyWorkspace] Toolbox config passed to inject:', { source: TOOLBOX_SOURCE, toolbox: TOOLBOX });
        disposeWorkspace();
        container.replaceChildren();

        console.info('[BlocklyWorkspace] Blockly.inject start');
        updateDebugState({ lastInitStep: 'calling Blockly.inject' });
        const ws = mod.inject(container, {
          toolbox: TOOLBOX,
          scrollbars: true,
          trashcan: false,
          sounds: false,
          toolboxPosition: 'start',
          move: { scrollbars: true, drag: true, wheel: true },
        });
        console.info('[BlocklyWorkspace] Blockly.inject complete', { workspaceNonNull: Boolean(ws) });

        if (!ws) {
          throw new Error('Blockly.inject returned a null workspace');
        }

        workspaceRef.current = ws;
        let toolboxLoaded = false;
        try {
          // `updateToolbox` is not available in every Blockly workspace-like mock/runtime.
          if (typeof ws.updateToolbox === 'function') {
            ws.updateToolbox(TOOLBOX);
            toolboxLoaded = true;
          } else if (typeof ws.getToolbox === 'function') {
            toolboxLoaded = Boolean(ws.getToolbox());
          } else {
            console.warn('[BlocklyWorkspace] Unable to verify toolbox load: workspace has no updateToolbox/getToolbox API');
          }
        } catch (toolboxErr) {
          console.error('[BlocklyWorkspace] Toolbox load failed:', {
            source: TOOLBOX_SOURCE,
            error: toolboxErr,
          });
        }

        onWorkspaceReadyChange?.(true);
        onReadyChange?.(true, 'workspace mounted');
        onError?.(null);
        updateDebugState({ mounted: true, toolboxLoaded, initError: '' });

        const onWorkspaceChanged = () => {
          syncBlockCount();
        };
        if (typeof ws.addChangeListener === 'function') {
          ws.addChangeListener(onWorkspaceChanged);
          workspaceChangeListener = onWorkspaceChanged;
        } else {
          console.warn('[BlocklyWorkspace] Workspace does not support addChangeListener; block count updates may be limited');
        }

        onWorkspaceApi?.({
          appendCommandBlock: (command: CommandType) => {
            const liveWorkspace = workspaceRef.current;
            if (!liveWorkspace) return;
            const blockType = commandToBlockType(command);
            const newBlock = liveWorkspace.newBlock(blockType);
            newBlock.initSvg();
            newBlock.render();

            const topBlocks = liveWorkspace.getTopBlocks(true);
            const previousTopBlocks = topBlocks.filter((block) => block.id !== newBlock.id);
            const lastTopBlock = previousTopBlocks[previousTopBlocks.length - 1] ?? null;
            let connected = false;

            if (lastTopBlock && newBlock.previousConnection) {
              let tail: Block = lastTopBlock;
              while (tail.getNextBlock()) {
                tail = tail.getNextBlock() as Block;
              }
              if (tail.nextConnection) {
                try {
                  tail.nextConnection.connect(newBlock.previousConnection);
                  connected = true;
                } catch {
                  connected = false;
                }
              }
            }

            if (!connected) {
              const y = Math.max(24, previousTopBlocks.reduce((maxY, block) => (
                Math.max(maxY, block.getRelativeToSurfaceXY().y + 64)
              ), 0));
              newBlock.moveBy(24, y);
            }
            liveWorkspace.render();
            syncBlockCount();
          },
          appendBlockType: (blockType: string) => {
            const liveWorkspace = workspaceRef.current;
            if (!liveWorkspace) return;
            if (!KNOWN_BLOCK_TYPES.has(blockType)) {
              console.warn('[BlocklyWorkspace] Unsupported block type:', blockType);
              return;
            }
            const newBlock = liveWorkspace.newBlock(blockType);
            newBlock.initSvg();
            newBlock.render();
            const topBlocks = liveWorkspace.getTopBlocks(true);
            const previousTopBlocks = topBlocks.filter((block) => block.id !== newBlock.id);
            const y = Math.max(24, previousTopBlocks.reduce((maxY, block) => (
              Math.max(maxY, block.getRelativeToSurfaceXY().y + 64)
            ), 0));
            newBlock.moveBy(24, y);
            liveWorkspace.render();
            syncBlockCount();
          },
          getBlockTypes: () => {
            const liveWorkspace = workspaceRef.current;
            if (!liveWorkspace) return [];

            const blockTypes: string[] = [];
            const topBlocks = liveWorkspace.getTopBlocks(true);

            for (const topBlock of topBlocks) {
              let block: Block | null = topBlock;
              while (block) {
                blockTypes.push(block.type);
                block = block.getNextBlock();
              }
            }

            return blockTypes;
          },
          clearWorkspace: () => {
            workspaceRef.current?.clear();
            syncBlockCount();
            try {
              localStorage.removeItem(WORKSPACE_STORAGE_KEY);
            } catch (err) {
              console.warn('[BlocklyWorkspace] Failed to clear persisted workspace state:', err);
            }
          },
        });

        // Restore previous workspace state from localStorage
        let restoredWorkspace = false;
        try {
          const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
          if (saved) {
            const dom = mod.utils.xml.textToDom(saved);
            mod.Xml.domToWorkspace(dom, ws);
            restoredWorkspace = true;
          }
        } catch (err) {
          console.warn('[BlocklyWorkspace] Failed to restore workspace state:', err);
        }

        try {
          if (!restoredWorkspace && ws.getAllBlocks(false).length === 0) {
            appendStarterBlock(ws, STARTER_BLOCK_TYPE);
          }
        } catch (err) {
          console.warn('[BlocklyWorkspace] Failed to inspect starter block state:', err);
        }

        resizeWorkspace();
        requestAnimationFrame(() => resizeWorkspace());
        syncBlockCount();
        updateDebugState({ lastInitStep: 'workspace rendered and resized' });
      } catch (err) {
        console.warn('[BlocklyWorkspace] Failed to initialize workspace:', err);
        const message = err instanceof Error ? err.message : String(err);
        updateDebugState({ initError: message, lastInitStep: 'initialization failed' });
        onWorkspaceReadyChange?.(false);
        onReadyChange?.(false, message);
        onError?.(message);
      } finally {
        initializing = false;
      }
    };

    resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (workspaceRef.current) {
            resizeWorkspace?.();
            return;
          }
          void tryInitWorkspace();
        })
      : null;
    resizeObserver?.observe(container);

    const onWindowResize = () => {
      if (workspaceRef.current) {
        resizeWorkspace?.();
        return;
      }
      void tryInitWorkspace();
    };
    window.addEventListener('resize', onWindowResize);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void tryInitWorkspace();
      }
    };
    const onWindowFocus = () => {
      void tryInitWorkspace();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onWindowFocus);
    window.addEventListener('pageshow', onWindowFocus);

    const retryInitAcrossFrames = (remaining: number) => {
      if (remaining <= 0 || disposed || workspaceRef.current) return;
      requestAnimationFrame(() => {
        void tryInitWorkspace();
        retryInitAcrossFrames(remaining - 1);
      });
    };
    // Delay initial attempts across a few frames so tab/layout transitions settle.
    retryInitAcrossFrames(3);

    const scheduleInitRetry = () => {
      if (disposed || workspaceRef.current) return;
      retryTimer = window.setTimeout(() => {
        void tryInitWorkspace();
        scheduleInitRetry();
      }, 250);
    };
    scheduleInitRetry();

    return () => {
      disposed = true;
      window.removeEventListener('resize', onWindowResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', onWindowFocus);
      window.removeEventListener('pageshow', onWindowFocus);
      resizeObserver?.disconnect();
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      if (resizeFrame !== null) {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = null;
      }

      if (workspaceRef.current && BlocklyMod) {
        try {
          const dom = BlocklyMod.Xml.workspaceToDom(workspaceRef.current);
          const text = BlocklyMod.utils.xml.domToText(dom);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, text);
        } catch (err) {
          console.warn('[BlocklyWorkspace] Failed to persist workspace state:', err);
        }
      }
      disposeWorkspace();
    };
  }, [commandToBlockType, onWorkspaceApi, onWorkspaceReadyChange, onReadyChange, onError, updateDebugState]);

  return (
    <div className={`flex h-full w-full min-h-[280px] flex-1 self-stretch flex-col overflow-hidden ${className}`}>
      {showDebugPanel && (
        <div className="mb-2 rounded border border-amber-700 bg-amber-950/40 p-2 text-xs text-amber-100" aria-label="Blockly debug status">
          <div className="font-semibold">Blockly Debug State</div>
          <div>{debugState.initStarted ? 'Blockly init started' : 'Blockly init not started'}</div>
          <div>{debugState.mounted ? 'Blockly mounted' : 'Blockly not mounted'}</div>
          <div>{debugState.toolboxLoaded ? 'Toolbox loaded' : 'Toolbox not loaded'}</div>
          <div>{`Block count: ${debugState.blockCount}`}</div>
          <div>{`Container: ${Math.round(debugState.containerWidth)} × ${Math.round(debugState.containerHeight)}`}</div>
          <div>{`Readiness: ${debugState.containerReadinessReason}`}</div>
          <div>{`Step: ${debugState.lastInitStep}`}</div>
          {debugState.initError && <div>{`Init error: ${debugState.initError}`}</div>}
        </div>
      )}
      <div
        ref={containerRef}
        className="w-full flex-1 min-h-0 overflow-hidden rounded border border-slate-600"
        aria-label="Block programming workspace"
      />
    </div>
  );
}
