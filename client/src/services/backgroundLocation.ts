/**
 * Background Location Service
 * 
 * Wraps @capacitor-community/background-geolocation for native Android foreground service.
 * Falls back to navigator.geolocation.watchPosition() in browser.
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// Webpack safe: registerPlugin doesn't attempt to resolve a physical JS file.
// It connects to the native Capacitor bridge at runtime.
const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');

const isNative = Capacitor.isNativePlatform();

export interface LocationFix {
  lat: number;
  lng: number;
  timestamp: Date;
}

export type LocationCallback = (location: LocationFix) => void;

let watcherId: string | null = null;
let browserWatchId: number | null = null;

/**
 * Start background location tracking.
 * 
 * On Android (Capacitor): starts a foreground service with persistent notification.
 * On Browser: uses navigator.geolocation.watchPosition() as fallback.
 * 
 * @param callback - Called with each location fix
 * @returns Promise that resolves when tracking starts
 */
export async function startBackgroundTracking(callback: LocationCallback): Promise<void> {
  // Stop any existing tracking first
  await stopBackgroundTracking();

  if (isNative) {
    if (!BackgroundGeolocation) {
      console.warn('[BackgroundLocation] Plugin not available, falling back to browser');
      startBrowserTracking(callback);
      return;
    }

    try {
      watcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: 'BusBuddy is tracking your location for the active ride.',
          backgroundTitle: 'BusBuddy — Driver Tracking Active',
          requestPermissions: true,
          stale: false,
          distanceFilter: 10, // meters — minimum distance between updates
        },
        (location: any, error: any) => {
          if (error) {
            if (error.code === 'NOT_AUTHORIZED') {
              console.error('[BackgroundLocation] Location permission denied');
              // Open app settings so user can grant permission
              if (window.confirm(
                'BusBuddy needs location access to track rides.\n\nOpen settings to grant permission?'
              )) {
                BackgroundGeolocation.openSettings();
              }
            } else {
              console.error('[BackgroundLocation] Error:', error.code, error.message);
            }
            return;
          }

          if (location) {
            callback({
              lat: location.latitude,
              lng: location.longitude,
              timestamp: new Date(location.time),
            });
          }
        }
      );
      console.log('[BackgroundLocation] Native watcher started:', watcherId);
    } catch (e) {
      console.error('[BackgroundLocation] Failed to start native tracking:', e);
      // Fallback to browser
      startBrowserTracking(callback);
    }
  } else {
    startBrowserTracking(callback);
  }
}

/**
 * Stop background location tracking and dismiss the foreground notification.
 */
export async function stopBackgroundTracking(): Promise<void> {
  if (watcherId && BackgroundGeolocation) {
    try {
      await BackgroundGeolocation.removeWatcher({ id: watcherId });
      console.log('[BackgroundLocation] Native watcher stopped');
    } catch (e) {
      console.error('[BackgroundLocation] Error stopping native tracking:', e);
    }
    watcherId = null;
  }

  if (browserWatchId !== null) {
    navigator.geolocation.clearWatch(browserWatchId);
    browserWatchId = null;
    console.log('[BackgroundLocation] Browser watch stopped');
  }
}

/**
 * Check if currently tracking
 */
export function isCurrentlyTracking(): boolean {
  return watcherId !== null || browserWatchId !== null;
}

/**
 * Check if running on a native platform (Android)
 */
export function isNativePlatform(): boolean {
  return isNative;
}

// --- Private: Browser fallback ---

function startBrowserTracking(callback: LocationCallback): void {
  if (!navigator.geolocation) {
    console.error('[BackgroundLocation] Geolocation not supported');
    return;
  }

  browserWatchId = navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: new Date(position.timestamp),
      });
    },
    (error) => {
      console.error(`[BackgroundLocation] Browser geolocation error (${error.code}):`, error.message);
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 1000,
    }
  );
  console.log('[BackgroundLocation] Browser watch started:', browserWatchId);
}
