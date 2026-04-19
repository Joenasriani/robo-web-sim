'use client';

interface BlocklyPanelProps {
  showHeader?: boolean;
  className?: string;
  prioritizeWorkspace?: boolean;
}

export default function BlocklyPanel({
  showHeader = true,
  className = '',
  prioritizeWorkspace,
}: BlocklyPanelProps) {
  void prioritizeWorkspace;

  return (
    <div className={`flex h-full min-h-0 flex-col rounded-lg border border-slate-700 bg-slate-900/40 p-4 ${className}`}>
      {showHeader && (
        <h3 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wide text-slate-300 mb-3">
          🧩 Block Programming
        </h3>
      )}
      <div className="border border-dashed border-zinc-700 rounded p-3 text-zinc-500 text-sm">
        🧩 Block Programming — <span className="font-medium">Coming Soon</span>
        <p className="text-xs mt-1">Visual command builder powered by Blockly. Planned for a future release.</p>
      </div>
    </div>
  );
}
