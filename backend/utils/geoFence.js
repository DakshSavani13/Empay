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
  const distance = getDistanceMeters(
    empLat,
    empLon,
    parseFloat(process.env.OFFICE_LATITUDE),
    parseFloat(process.env.OFFICE_LONGITUDE)
  );
  return {
    isWithin: distance <= parseFloat(process.env.ALLOWED_RADIUS_METERS),
    distance: Math.round(distance)
  };
}

module.exports = { isWithinGeofence, getDistanceMeters };
