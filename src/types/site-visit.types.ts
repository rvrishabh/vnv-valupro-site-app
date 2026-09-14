export type PhotoSection = 'SITE_VISIT' | 'GOOGLE_EARTH' | 'CIRCLE_RATE';

/** Backend caps site-visit photos so the annexure's two rows stay legible. */
export const MAX_SITE_VISIT_PHOTOS = 10;

/** Minimum the app asks for before a visit can be submitted. */
export const MIN_SITE_VISIT_PHOTOS = 4;

export interface ValuationPhoto {
  id: string;
  section: PhotoSection;
  sortOrder: number;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  /** Public R2 URL — usable directly as an <Image> source. */
  url: string;
}

export interface LocalPhoto {
  uri: string;
  type: string;
  fileName: string;
}
