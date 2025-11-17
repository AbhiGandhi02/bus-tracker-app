/**
 * Calculates the distance between two {lat, lng} points in meters
 * using the Haversine formula.
 */
exports.getDistance = (coords1, coords2) => {
  const R = 6371e3; // Earth's radius in meters
  const lat1 = coords1.lat * (Math.PI / 180); // φ, λ in radians
  const lat2 = coords2.lat * (Math.PI / 180);
  const deltaLat = (coords2.lat - coords1.lat) * (Math.PI / 180);
  const deltaLng = (coords2.lng - coords1.lng) * (Math.PI / 180);

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // in meters
  return distance;
};