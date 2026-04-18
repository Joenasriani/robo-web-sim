'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WorkspaceSvg, Block } from 'blockly';
import type { CommandType } from '@/sim/commandExecution';

/** Colour hue values for each command block. */
const BLOCK_COLOURS = {
  forward:  160,
  backward: 200,
  turn:     280,
  wait:      60,
};

const BLOCK_DEFINITIONS = [
  {
    type: 'robot_forward',
    message: '↑ Move Forward',
    colour: BLOCK_COLOURS.forward,
    tooltip: 'Move the robot forward one step',
  },
  {
    type: 'robot_backward',
    message: '↓ Move Backward',
    colour: BLOCK_COLOURS.backward,
    tooltip: 'Move the robot backward one step',
  },
  {
    type: 'robot_turn_left',
    message: '← Turn Left',
    colour: BLOCK_COLOURS.turn,
    tooltip: 'Rotate the robot 22.5° to the left',
  },
  {
    type: 'robot_turn_right',
    message: '→ Turn Right',
    colour: BLOCK_COLOURS.turn,
    tooltip: 'Rotate the robot 22.5° to the right',
  },
  {
    type: 'robot_wait',
    message: '⏸ Wait',
    colour: BLOCK_COLOURS.wait,
    tooltip: 'Pause the robot for one step',
  },
];

const TOOLBOX = {
  kind: 'flyoutToolbox',
  contents: BLOCK_DEFINITIONS.map((def) => ({ kind: 'block', type: def.type })),
};

const WORKSPACE_STORAGE_KEY = 'blockly-workspace-state';

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
  className?: string;
}

export interface BlocklyWorkspaceApi {
  appendCommandBlock: (command: CommandType) => void;
  getBlockTypes: () => string[];
  clearWorkspace: () => void;
}

/**
 * Renders a Blockly workspace pre-loaded with robot command blocks.
 * When "Send to Queue" is clicked, the ordered list of block type strings
 * is passed to the `onSendToQueue` callback.
 *
 * Must only be rendered on the client (use dynamic import with ssr: false).
 */
export default function BlocklyWorkspace({
  onWorkspaceApi,
  onWorkspaceReadyChange,
  className = '',
}: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);

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
    if (!containerRef.current) return;

    let disposed = false;
    let BlocklyMod: typeof import('blockly') | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeWorkspace: (() => void) | null = null;
    let resizeFrame: number | null = null;
    let retryTimer: number | null = null;
    let initializing = false;
    const container = containerRef.current;

    const getContainerLayoutMetrics = () => {
      const parent = container.parentElement;
      const height = container.clientHeight > 0 ? container.clientHeight : parent?.clientHeight ?? 0;
      const width = container.clientWidth > 0 ? container.clientWidth : parent?.clientWidth ?? 0;
      return { height, width };
    };

    const isContainerReady = () => {
      if (!container.isConnected) return false;
      const { height, width } = getContainerLayoutMetrics();
      if (height <= 0 || width <= 0) return false;
      const style = window.getComputedStyle(container);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return true;
    };

    const disposeWorkspace = () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose();
        workspaceRef.current = null;
      }
      onWorkspaceApi?.(null);
      onWorkspaceReadyChange?.(false);
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
          mod.svgResize(liveWorkspace);
        }
        resizeFrame = null;
      });
    };

    const tryInitWorkspace = async () => {
      if (disposed || initializing || workspaceRef.current) return;
      if (!isContainerReady()) return;
      initializing = true;
      try {
        const mod = BlocklyMod ?? await import('blockly');
        if (disposed || !isContainerReady()) {
          initializing = false;
          return;
        }

        BlocklyMod = mod;
        registerBlocks(mod);
        disposeWorkspace();
        const { height } = getContainerLayoutMetrics();
        if (container.clientHeight <= 0 && height > 0) {
          container.style.height = `${height}px`;
        }
        container.replaceChildren();

        const ws = mod.inject(container, {
          toolbox: TOOLBOX,
          scrollbars: true,
          trashcan: false,
          sounds: false,
          toolboxPosition: 'start',
          move: { scrollbars: true, drag: true, wheel: true },
        });
        workspaceRef.current = ws;
        onWorkspaceReadyChange?.(true);

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
                  // Connection can fail if block types are incompatible; fall back to free placement below.
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
            try {
              localStorage.removeItem(WORKSPACE_STORAGE_KEY);
            } catch (err) {
              console.warn('[BlocklyWorkspace] Failed to clear persisted workspace state:', err);
            }
          },
        });

        // Restore previous workspace state from localStorage
        try {
          const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
          if (saved) {
            const dom = mod.utils.xml.textToDom(saved);
            mod.Xml.domToWorkspace(dom, ws);
          }
        } catch (err) {
          // Warn on restoration failure — could indicate corrupted or incompatible state
          console.warn('[BlocklyWorkspace] Failed to restore workspace state:', err);
        }

        resizeWorkspace();
      } catch (err) {
        console.warn('[BlocklyWorkspace] Failed to initialize workspace:', err);
        onWorkspaceReadyChange?.(false);
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
    void tryInitWorkspace();
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
        // Persist workspace state before disposing
        try {
          const dom = BlocklyMod.Xml.workspaceToDom(workspaceRef.current);
          const text = BlocklyMod.utils.xml.domToText(dom);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, text);
        } catch (err) {
          // Warn on persistence failure — could indicate storage quota exceeded
          console.warn('[BlocklyWorkspace] Failed to persist workspace state:', err);
        }
      }
      disposeWorkspace();
    };
  }, [commandToBlockType, onWorkspaceApi, onWorkspaceReadyChange]);

  return (
    <div className={`flex h-full w-full min-h-0 flex-1 self-stretch flex-col overflow-hidden ${className}`}>
      <div
        ref={containerRef}
        className="h-full w-full flex-1 min-h-0 overflow-hidden rounded border border-slate-600"
        aria-label="Block programming workspace"
      />
    </div>
  );
}
