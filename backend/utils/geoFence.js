const toRad = (value) => (value * Math.PI) / 180;

/**
 * Calculate distance between two GPS coordinates using the Haversine formula
 * @returns distance in meters
 */
function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if given coordinates are within the office geofence
 */
function isWithinGeofence(empLat, empLon) {
  const officeLat = parseFloat(process.env.OFFICE_LATITUDE) || 23.0225;
  const officeLon = parseFloat(process.env.OFFICE_LONGITUDE) || 72.5714;
  const allowedRadius = parseFloat(process.env.ALLOWED_RADIUS_METERS) || 100;

  const distance = getDistanceMeters(empLat, empLon, officeLat, officeLon);
  const roundedDist = Math.round(distance);

  // If geofence is disabled, or in development / demo mode, allow check-in without blocking
  if (
    process.env.DISABLE_GEOFENCE === 'true' ||
    process.env.NODE_ENV === 'development' ||
    process.env.DEMO_MODE === 'true'
  ) {
    return {
      isWithin: true,
      distance: roundedDist
    };
  }

  return {
    isWithin: distance <= allowedRadius,
    distance: roundedDist
  };
}

module.exports = { isWithinGeofence, getDistanceMeters };
