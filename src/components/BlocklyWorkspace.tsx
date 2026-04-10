'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { WorkspaceSvg, Block } from 'blockly';

/** Colour hue values for each command block. */
const BLOCK_COLOURS = {
  forward:  160,
  backward: 200,
  turn:     280,
  wait:      60,
};

const BLOCK_DEFINITIONS = [
  { type: 'robot_forward',    message: '↑ Move Forward',  colour: BLOCK_COLOURS.forward },
  { type: 'robot_backward',   message: '↓ Move Backward', colour: BLOCK_COLOURS.backward },
  { type: 'robot_turn_left',  message: '← Turn Left',     colour: BLOCK_COLOURS.turn },
  { type: 'robot_turn_right', message: '→ Turn Right',    colour: BLOCK_COLOURS.turn },
  { type: 'robot_wait',       message: '⏸ Wait',          colour: BLOCK_COLOURS.wait },
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
    const colour = def.colour;
    const message = def.message;
    Blockly.Blocks[def.type] = {
      init(this: Block) {
        this.appendDummyInput().appendField(message);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(colour);
        this.setTooltip(message);
      },
    };
  }
}

interface BlocklyWorkspaceProps {
  onSendToQueue: (blockTypes: string[]) => void;
}

/**
 * Renders a Blockly workspace pre-loaded with robot command blocks.
 * When "Send to Queue" is clicked, the ordered list of block type strings
 * is passed to the `onSendToQueue` callback.
 *
 * Must only be rendered on the client (use dynamic import with ssr: false).
 */
export default function BlocklyWorkspace({ onSendToQueue }: BlocklyWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    let ws: WorkspaceSvg | null = null;
    let BlocklyMod: typeof import('blockly') | null = null;

    (async () => {
      const mod = await import('blockly');
      if (disposed || !containerRef.current) return;

      BlocklyMod = mod;
      registerBlocks(mod);

      ws = mod.inject(containerRef.current, {
        toolbox: TOOLBOX,
        scrollbars: true,
        trashcan: true,
        move: { scrollbars: true, drag: true, wheel: true },
      });
      workspaceRef.current = ws;

      // Restore previous workspace state from localStorage
      try {
        const saved = localStorage.getItem(WORKSPACE_STORAGE_KEY);
        if (saved && ws) {
          const dom = mod.utils.xml.textToDom(saved);
          mod.Xml.domToWorkspace(dom, ws);
        }
      } catch {
        // Ignore restoration errors — start with a blank workspace
      }
    })();

    return () => {
      disposed = true;
      if (ws && BlocklyMod) {
        // Persist workspace state before disposing
        try {
          const dom = BlocklyMod.Xml.workspaceToDom(ws);
          const text = BlocklyMod.utils.xml.domToText(dom);
          localStorage.setItem(WORKSPACE_STORAGE_KEY, text);
        } catch {
          // Ignore persistence errors
        }
        ws.dispose();
      }
      workspaceRef.current = null;
    };
  }, []);

  /** Collect block types in order from the workspace and forward to parent. */
  const handleSendToQueue = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const blockTypes: string[] = [];
    const topBlocks = ws.getTopBlocks(true);

    for (const topBlock of topBlocks) {
      let block: Block | null = topBlock;
      while (block) {
        blockTypes.push(block.type);
        block = block.getNextBlock();
      }
    }

    onSendToQueue(blockTypes);
  }, [onSendToQueue]);

  const handleClearWorkspace = useCallback(() => {
    workspaceRef.current?.clear();
    try {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Blockly injection target */}
      <div
        ref={containerRef}
        className="w-full rounded border border-slate-600 overflow-hidden"
        style={{ height: '280px' }}
        aria-label="Block programming workspace"
      />

      {/* Workspace action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleSendToQueue}
          className="btn-green flex-1 text-xs"
          title="Add all blocks to the command queue"
        >
          ➕ Send to Queue
        </button>
        <button
          onClick={handleClearWorkspace}
          className="btn-secondary text-xs"
          title="Remove all blocks from the workspace"
        >
          🗑 Clear Blocks
        </button>
      </div>
    </div>
  );
}
