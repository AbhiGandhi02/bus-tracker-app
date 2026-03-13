/**
 * Location Queue Service
 * 
 * Queues location updates and sends them to the server.
 * On network failure, stores in an in-memory queue and retries periodically.
 * Ensures location data isn't lost during connectivity gaps.
 */

import { scheduledRideAPI } from './api';
import { RideLocation } from '../types';

interface QueuedLocation {
  rideId: string;
  location: RideLocation;
  retries: number;
}

const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 5;
const RETRY_INTERVAL_MS = 5000; // 5 seconds

let pendingQueue: QueuedLocation[] = [];
let retryTimerId: ReturnType<typeof setInterval> | null = null;

/**
 * Initialize the queue for a specific ride.
 * Starts the retry timer for offline recovery.
 */
export function initQueue(rideId: string): void {
  pendingQueue = [];

  // Start periodic retry for queued items
  if (retryTimerId) {
    clearInterval(retryTimerId);
  }
  retryTimerId = setInterval(flushQueue, RETRY_INTERVAL_MS);
}

/**
 * Enqueue and send a location update.
 * If the send fails, the update is stored for later retry.
 */
export async function enqueueLocation(
  rideId: string,
  location: RideLocation
): Promise<void> {
  try {
    await scheduledRideAPI.updateLocation(rideId, location);
    // Success — nothing to queue
  } catch (error) {
    // Network error — queue for retry
    console.warn('[LocationQueue] Send failed, queuing for retry:', error);

    if (pendingQueue.length >= MAX_QUEUE_SIZE) {
      // Remove oldest entry to make room
      pendingQueue.shift();
    }

    pendingQueue.push({
      rideId,
      location,
      retries: 0,
    });
  }
}

/**
 * Flush the pending queue — attempt to send all queued locations.
 * Called periodically by the retry timer.
 */
async function flushQueue(): Promise<void> {
  if (pendingQueue.length === 0) return;

  // Don't flush when offline
  if (!navigator.onLine) return;

  const itemsToSend = [...pendingQueue];
  pendingQueue = [];

  for (const item of itemsToSend) {
    try {
      await scheduledRideAPI.updateLocation(item.rideId, item.location);
    } catch (error) {
      item.retries += 1;

      if (item.retries < MAX_RETRIES) {
        // Re-queue for another retry
        pendingQueue.push(item);
      } else {
        // Give up on this location after max retries
        console.error('[LocationQueue] Dropping location after max retries:', item.location);
      }
    }
  }
}

/**
 * Stop the queue and flush remaining items.
 * Called when tracking stops.
 */
export async function destroyQueue(): Promise<void> {
  if (retryTimerId) {
    clearInterval(retryTimerId);
    retryTimerId = null;
  }

  // Final flush attempt
  if (pendingQueue.length > 0 && navigator.onLine) {
    await flushQueue();
  }

  pendingQueue = [];
}

/**
 * Get the current queue length (for debugging/UI)
 */
export function getQueueLength(): number {
  return pendingQueue.length;
}
