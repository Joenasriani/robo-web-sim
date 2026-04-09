'use client';

import { useSimulatorStore, EventEntry } from '@/sim/robotController';

const TYPE_DOT: Record<EventEntry['type'], string> = {
  info: 'bg-blue-500',
  success: 'bg-green-500',
  error: 'bg-red-500',
  warning: 'bg-yellow-500',
};

function formatAge(ts: number): string {
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  return `${mins}m ago`;
}

export default function EventLog() {
  const eventLog = useSimulatorStore((s) => s.eventLog);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">Event Log</h3>
      <div className="bg-slate-900 rounded-lg p-2 min-h-[60px] max-h-[160px] overflow-y-auto flex flex-col gap-1">
        {eventLog.length === 0 ? (
          <p className="text-xs text-slate-500 text-center mt-3">No events yet</p>
        ) : (
          [...eventLog].reverse().map((entry) => (
            <div key={entry.id} className="flex items-start gap-2 text-xs">
              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[entry.type]}`} />
              <span className="text-slate-300 flex-1 leading-relaxed">{entry.message}</span>
              <span className="text-slate-600 shrink-0 tabular-nums">{formatAge(entry.timestamp)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
