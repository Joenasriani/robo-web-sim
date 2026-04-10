'use client';

import { useEffect, useRef } from 'react';
import { useSimulatorStore } from '@/sim/robotController';

/**
 * Invisible client component that hydrates the Zustand store from localStorage
 * exactly once on first mount.  Must be rendered inside the simulator page.
 */
export default function StoreHydrator() {
  const hydrateFromStorage = useSimulatorStore((s) => s.hydrateFromStorage);
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  return null;
}
