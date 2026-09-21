/**
 * Address for the photo stamp, from OpenStreetMap Nominatim — free and
 * keyless, which fits the volume of a site visit (a lookup when the camera
 * opens and again only after the engineer moves). The usage policy requires an
 * identifying User-Agent and at most one request per second.
 */
export interface StampAddress {
  /** "Noida, Uttar Pradesh, India" */
  title: string;
  /** "Trans Yamuna Colony Marg, Sector 107, Noida, Uttar Pradesh, India" (pin code shown separately) */
  line: string;
  /** Six-digit Indian PIN, or null when no lookup could supply a valid one. */
  pincode: string | null;
}

const PIN_PATTERN = /^\d{6}$/;

/** OSM often carries "201 304", "201304;201301" or non-PIN values; keep only a clean six-digit PIN. */
const cleanPincode = (value?: string | null) => {
  const first = value?.split(/[;,]/)[0]?.replace(/\s+/g, '');
  return first && PIN_PATTERN.test(first) ? first : null;
};

/**
 * OSM's postcode coverage in India is patchy, so fall back to BigDataCloud's
 * keyless client endpoint when Nominatim has none.
 */
const fallbackPincode = async (latitude: number, longitude: number, signal?: AbortSignal) => {
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`,
      { signal },
    );
    if (!response.ok) {
      return null;
    }
    const data = (await response.json()) as { postcode?: string };
    return cleanPincode(data.postcode);
  } catch {
    return null;
  }
};

interface NominatimResponse {
  display_name?: string;
  address?: Record<string, string | undefined>;
}

export const reverseGeocode = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<StampAddress | null> => {
  const url =
    'https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1' +
    `&lat=${latitude}&lon=${longitude}`;
  const response = await fetch(url, {
    signal,
    headers: {
      'User-Agent': 'VNVSiteApp/1.0 (VNV Engineers site engineer app)',
      'Accept-Language': 'en',
    },
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as NominatimResponse;
  const address = data.address ?? {};
  const city =
    address.city ?? address.town ?? address.village ?? address.suburb ?? address.county ?? address.state_district;
  const pincode =
    cleanPincode(address.postcode) ?? (await fallbackPincode(latitude, longitude, signal));
  const title = [city, address.state, address.country].filter(Boolean).join(', ');
  if (!title && !data.display_name) {
    return null;
  }
  // The PIN gets its own line on the stamp, so drop it from the long address
  // (where it sat at the tail and was the first thing clipped).
  const line = (data.display_name ?? title)
    .split(', ')
    .filter(part => cleanPincode(part) === null)
    .join(', ');
  return { title: title || line, line, pincode };
};
