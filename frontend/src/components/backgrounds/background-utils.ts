import { getPerformanceTier } from '@/lib/performance';

export function shouldAnimateBackground(): boolean {
  return getPerformanceTier() === 'HIGH';
}

export function shouldShowGrain(): boolean {
  return getPerformanceTier() === 'HIGH';
}

export function motionAnimation(animation: string): string | undefined {
  return shouldAnimateBackground() ? animation : undefined;
}
