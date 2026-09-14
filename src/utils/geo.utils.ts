const DIRECTIONS_8 = [
  'North',
  'North-East',
  'East',
  'South-East',
  'South',
  'South-West',
  'West',
  'North-West',
] as const;

export const normalizeHeading = (heading: number) => ((heading % 360) + 360) % 360;

/**
 * Quadrant label printed next to the degrees — "166° SE" — the way GPS map
 * camera apps show it: the exact cardinal only within a few degrees of it.
 */
export const headingQuadrant = (heading: number) => {
  const h = normalizeHeading(heading);
  const near = (target: number) => Math.min(Math.abs(h - target), 360 - Math.abs(h - target)) <= 5;
  if (near(0)) return 'N';
  if (near(90)) return 'E';
  if (near(180)) return 'S';
  if (near(270)) return 'W';
  if (h < 90) return 'NE';
  if (h < 180) return 'SE';
  if (h < 270) return 'SW';
  return 'NW';
};

/** Nearest of the eight directions the camera points at — "Facing South". */
export const facingDirection = (heading: number) =>
  DIRECTIONS_8[Math.round(normalizeHeading(heading) / 45) % 8];

export const formatCoordinate = (value: number) => value.toFixed(6);

/** Web-mercator tile coordinates (with fractional part) for a lat/lng at a zoom level. */
export const latLngToTile = (lat: number, lng: number, zoom: number) => {
  const n = 2 ** zoom;
  const latRad = (lat * Math.PI) / 180;
  return {
    x: ((lng + 180) / 360) * n,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n,
  };
};

/** Keyless satellite imagery (Esri World Imagery), matching the reference app's map thumbnail. */
export const satelliteTileUrl = (zoom: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${y}/${x}`;

/** Metres between two points (haversine) — used to decide when to re-geocode. */
export const distanceMetres = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) => {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
