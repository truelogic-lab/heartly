/**
 * Heartly Dating Engine — geography helpers.
 * Pure functions. No I/O.
 */

const EARTH_RADIUS_KM = 6371;

const toRad = (deg) => (deg * Math.PI) / 180;

/**
 * Haversine distance between two points in kilometers.
 * @param {{lat:number,lng:number}} a
 * @param {{lat:number,lng:number}} b
 * @returns {number} kilometers
 */
export function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Convert a distance into a 0–1 "closeness" score.
 * 1.0 = same point, 0.0 = at or beyond maxDistanceKm.
 */
export function closenessScore(distance, maxDistanceKm) {
  if (!Number.isFinite(distance)) return 0;
  if (distance <= 0) return 1;
  if (distance >= maxDistanceKm) return 0;
  return 1 - distance / maxDistanceKm;
}
