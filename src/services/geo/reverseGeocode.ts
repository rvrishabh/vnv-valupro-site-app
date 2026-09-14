/**
 * Address for the photo stamp, from OpenStreetMap Nominatim — free and
 * keyless, which fits the volume of a site visit (a lookup when the camera
 * opens and again only after the engineer moves). The usage policy requires an
 * identifying User-Agent and at most one request per second.
 */
export interface StampAddress {
  /** "Noida, Uttar Pradesh, India" */
  title: string;
  /** "Trans Yamuna Colony Marg, Sector 107, Noida, Uttar Pradesh, 201304, India" */
  line: string;
}

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
  const title = [city, address.state, address.country].filter(Boolean).join(', ');
  if (!title && !data.display_name) {
    return null;
  }
  return { title: title || (data.display_name ?? ''), line: data.display_name ?? title };
};
