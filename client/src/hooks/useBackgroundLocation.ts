/**
 * useBackgroundLocation Hook
 * 
 * React hook that provides background location tracking functionality.
 * Uses native Capacitor foreground service on Android,
 * falls back to navigator.geolocation on browser.
 * 
 * Includes offline queueing for resilient location sending.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { RideLocation } from '../types';
import {
  startBackgroundTracking,
  stopBackgroundTracking,
  isNativePlatform,
  LocationFix,
} from '../services/backgroundLocation';
import {
  initQueue,
  enqueueLocation,
  destroyQueue,
} from '../services/locationQueue';

export interface UseBackgroundLocationReturn {
  isTracking: boolean;
  lastLocation: RideLocation | null;
  error: string | null;
  isNative: boolean;
  startTracking: (rideId: string) => Promise<void>;
  stopTracking: () => Promise<void>;
}

export function useBackgroundLocation(): UseBackgroundLocationReturn {
  const [isTracking, setIsTracking] = useState(false);
  const [lastLocation, setLastLocation] = useState<RideLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rideIdRef = useRef<string | null>(null);
  const isNative = isNativePlatform();

  /**
   * Start tracking for a specific ride.
   * Requests permissions, starts the background service, and initializes the queue.
   */
  const startTracking = useCallback(async (rideId: string) => {
    try {
      setError(null);
      rideIdRef.current = rideId;

      // Initialize the offline queue
      initQueue(rideId);

      // Start background location tracking
      await startBackgroundTracking((location: LocationFix) => {
        const rideLocation: RideLocation = {
          lat: location.lat,
          lng: location.lng,
          timestamp: location.timestamp,
        };

        // Update UI state
        setLastLocation(rideLocation);

        // Send to server (with offline queueing)
        if (rideIdRef.current) {
          enqueueLocation(rideIdRef.current, rideLocation);
        }
      });

      setIsTracking(true);
    } catch (e: any) {
      const errorMsg = e?.message || 'Failed to start location tracking';
      setError(errorMsg);
      console.error('[useBackgroundLocation] Start error:', e);
    }
  }, []);

  /**
   * Stop tracking and clean up resources.
   */
  const stopTracking = useCallback(async () => {
    try {
      await stopBackgroundTracking();
      await destroyQueue();
    } catch (e) {
      console.error('[useBackgroundLocation] Stop error:', e);
    } finally {
      setIsTracking(false);
      setLastLocation(null);
      rideIdRef.current = null;
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rideIdRef.current) {
        stopBackgroundTracking().catch(() => {});
        destroyQueue().catch(() => {});
      }
    };
  }, []);

  return {
    isTracking,
    lastLocation,
    error,
    isNative,
    startTracking,
    stopTracking,
  };
}
