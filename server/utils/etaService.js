/**
 * ETA Service — Calculates real-time ETA using Mapbox Directions API
 * with live traffic data. Includes per-ride throttling to avoid
 * excessive API calls.
 */

// In-memory cache: rideId -> { eta, calculatedAt }
const etaCache = new Map();

// Throttle: only call Mapbox API once per ride every 30 seconds
const THROTTLE_MS = 30 * 1000;

/**
 * Get traffic-aware ETA from driver's current position to the destination.
 * Returns ETA in seconds, or null if unavailable/throttled.
 *
 * @param {string} rideId - Unique ride identifier (used for throttle cache)
 * @param {{ lat: number, lng: number }} driverLocation - Current driver GPS coords
 * @param {{ lat: number, lng: number }} destination - Arrival/destination coords
 * @returns {Promise<number|null>} ETA in seconds, or null
 */
exports.getETA = async (rideId, driverLocation, destination) => {
  // Validate inputs
  if (
    !driverLocation || !destination ||
    !isValidCoord(driverLocation.lat, driverLocation.lng) ||
    !isValidCoord(destination.lat, destination.lng)
  ) {
    return getCachedETA(rideId);
  }

  // Check throttle — return cached ETA if within throttle window
  const cached = etaCache.get(rideId);
  if (cached && (Date.now() - cached.calculatedAt) < THROTTLE_MS) {
    return cached.eta;
  }

  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    console.warn('[ETA] MAPBOX_ACCESS_TOKEN not set in environment');
    return getCachedETA(rideId);
  }

  try {
    // Mapbox Directions API with driving-traffic profile for live traffic ETA
    // Coordinates format: lng,lat (Mapbox uses longitude first)
    const url = new URL(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${driverLocation.lng},${driverLocation.lat};${destination.lng},${destination.lat}`
    );
    url.searchParams.set('access_token', token);
    url.searchParams.set('overview', 'false');      // No polyline needed
    url.searchParams.set('geometries', 'geojson');
    url.searchParams.set('steps', 'false');          // No turn-by-turn needed

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'User-Agent': 'BusBuddy-Server/1.0' }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.error(`[ETA] Mapbox API error: ${response.status} ${response.statusText}`);
      return getCachedETA(rideId);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('[ETA] No routes returned from Mapbox');
      return getCachedETA(rideId);
    }

    const etaSeconds = Math.round(data.routes[0].duration);

    // Cache the result
    etaCache.set(rideId, {
      eta: etaSeconds,
      calculatedAt: Date.now()
    });

    return etaSeconds;

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[ETA] Mapbox API request timed out');
    } else {
      console.error('[ETA] Error fetching ETA:', error.message);
    }
    return getCachedETA(rideId);
  }
};

/**
 * Clear cached ETA for a ride (call when ride completes/stops)
 */
exports.clearETACache = (rideId) => {
  etaCache.delete(rideId);
};

/**
 * Get cached ETA if available (fallback when API fails)
 */
function getCachedETA(rideId) {
  const cached = etaCache.get(rideId);
  return cached ? cached.eta : null;
}

/**
 * Validate that lat/lng are reasonable numbers
 */
function isValidCoord(lat, lng) {
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    !isNaN(lat) && !isNaN(lng) &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
}
