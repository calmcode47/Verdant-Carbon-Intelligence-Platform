'use client';

import { useEffect, useState } from 'react';

const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (!intervalId) {
    intervalId = setInterval(() => {
      listeners.forEach((notify) => notify());
    }, 1000);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function useSharedSecondTick(): number {
  const [tick, setTick] = useState(() => Date.now());

  useEffect(() => subscribe(() => setTick(Date.now())), []);

  return tick;
}
