'use client';

import { useEffect } from 'react';
import { useCarbonStore } from '@/store/carbon-store';

export function BackendHydrator() {
  const syncFromBackend = useCarbonStore((state) => state.syncFromBackend);

  useEffect(() => {
    syncFromBackend();
  }, [syncFromBackend]);

  return null;
}
