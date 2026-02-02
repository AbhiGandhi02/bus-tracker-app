import { useRef, useCallback, useEffect } from 'react';

// Type declarations for the Screen Wake Lock API
interface WakeLockSentinelType extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinelType, ev: Event) => void) | null;
}

interface WakeLockType {
  request(type: 'screen'): Promise<WakeLockSentinelType>;
}

const useWakeLock = () => {
  const wakeLockRef = useRef<WakeLockSentinelType | null>(null);

  // Function to request the wake lock
  const requestWakeLock = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if ('wakeLock' in navigator && nav.wakeLock) {
      try {
        wakeLockRef.current = await (nav.wakeLock as WakeLockType).request('screen');
        console.log('Screen Wake Lock active: Phone will not sleep.');

        // If the lock is released (e.g. user minimizes window), listen to re-acquire it
        wakeLockRef.current.addEventListener('release', () => {
          console.log('Screen Wake Lock released.');
        });
      } catch (err) {
        console.error(`Wake Lock failed: ${err}`);
      }
    } else {
      console.warn('Wake Lock API not supported in this browser.');
    }
  }, []);

  // Function to release the lock manually
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  }, []);

  // Auto-reacquire lock if the user switches tabs and comes back
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !wakeLockRef.current) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock(); // Cleanup on unmount
    };
  }, [requestWakeLock, releaseWakeLock]);

  return { requestWakeLock, releaseWakeLock };
};

export default useWakeLock;