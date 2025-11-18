'use strict';

const EARTH_RADIUS_KM = 6371;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  if (
    [lat1, lon1, lat2, lon2].some(
      (value) => value === null || value === undefined || Number.isNaN(Number(value)),
    )
  ) {
    return null;
  }

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const originLatRad = toRadians(lat1);
  const destLatRad = toRadians(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(originLatRad) * Math.cos(destLatRad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

module.exports = {
  calculateDistanceKm,
};


