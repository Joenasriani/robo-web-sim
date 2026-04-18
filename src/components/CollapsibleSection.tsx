'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  storageKey: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

function readStoredOpenState(storageKey: string): boolean | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === 'true') return true;
    if (raw === 'false') return false;
  } catch {
    // no-op: localStorage may be unavailable (SSR/privacy mode)
  }
  return null;
}

export default function CollapsibleSection({
  title,
  storageKey,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen;
    return readStoredOpenState(storageKey) ?? defaultOpen;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, String(isOpen));
    } catch {
      // no-op: localStorage may be unavailable (SSR/privacy mode)
    }
  }, [isOpen, storageKey]);

  const indicator = useMemo(() => (isOpen ? '▲' : '▼'), [isOpen]);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/30">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-300">{title}</span>
        <span className="text-xs text-slate-500" aria-hidden="true">{indicator}</span>
      </button>
      <div
        className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none"
        style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden px-3 pb-3" aria-hidden={!isOpen}>
          {children}
        </div>
      </div>
    </div>
  );
}
