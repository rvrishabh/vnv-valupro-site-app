import { z } from 'zod';

/**
 * The VNV Engineers paper visit form, field for field. Everything the engineer
 * types is kept verbatim under `ValuationReport.siteVisit`; the handful of
 * fields the admin valuation editor already has columns for are also mapped
 * onto those (see site-visit.utils.ts#toValuationPayload).
 */

export const DIRECTIONS = ['east', 'west', 'north', 'south'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const AUTHORITY_OPTIONS = [
  'Nagar Nigam',
  'Nagar Palika',
  'Nagar Panchayat',
  'Gram Panchayat',
  'ADA',
] as const;

export const STRUCTURE_OPTIONS = [
  'RCC',
  'Girder Stone',
  'Tin Shade',
  'Wooden Planks',
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  'Residential',
  'Commercial',
  'Industrial',
  'Land',
  'Mixed Use',
] as const;

export const OCCUPIED_BY_OPTIONS = ['Owner', 'Tenant', 'Vacant'] as const;

export const METER_OPTIONS = ['Matched', 'Not Matched'] as const;

export const YES_NO_OPTIONS = ['Yes', 'No'] as const;

export const FLOOR_OPTIONS = [
  'Basement',
  'Ground Floor',
  'First Floor',
  'Second Floor',
  'Third Floor',
  'Fourth Floor',
] as const;

const optionalText = z.string().trim().optional().default('');

const optionalCount = z
  .string()
  .trim()
  .optional()
  .default('')
  .refine(v => v === '' || /^\d{1,3}$/.test(v), 'Enter a whole number');

const optionalAmount = z
  .string()
  .trim()
  .optional()
  .default('')
  .refine(v => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Enter a valid amount');

const sideLength = z
  .string()
  .trim()
  .optional()
  .default('')
  .refine(v => v === '' || /^\d+(\.\d{1,2})?$/.test(v), 'Feet, e.g. 30 or 30.5');

export const floorSchema = z.object({
  name: z.string().min(1, 'Select a floor'),
  coveredArea: optionalText,
  rooms: optionalCount,
  toilets: optionalCount,
  kitchens: optionalCount,
  others: optionalText,
});

export const siteVisitSchema = z.object({
  visitDate: z.string().min(1, 'Visit date is required'),
  bankName: optionalText,
  ownerName: z.string().trim().min(1, 'Owner / firm name is required'),
  addressAsPerSite: z.string().trim().min(1, 'Address as per site is required'),

  personMetName: z.string().trim().min(1, 'Name of the person met is required'),
  personMetMobile: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine(v => v === '' || /^[6-9]\d{9}$/.test(v), 'Enter a valid 10 digit mobile'),
  landmark: optionalText,

  meterNumber: optionalText,
  meterStatus: optionalText,

  gpsCoordinates: z.string().trim().min(1, 'Capture the GPS location at the site'),

  authority: optionalText,
  occupiedBy: optionalText,
  occupancy: optionalText,
  communityDominated: optionalText,
  highTension: optionalText,

  rateByOwner: optionalAmount,
  rateByLocals: optionalAmount,
  propertyDealerRef: optionalText,

  structureTypes: z.array(z.string()).default([]),
  ageOfProperty: z
    .string()
    .trim()
    .optional()
    .default('')
    .refine(
      v => v === '' || (/^\d{4}$/.test(v) && Number(v) >= 1800 && Number(v) <= new Date().getFullYear()),
      'Year of construction, e.g. 2010',
    ),
  typeOfProperty: z.string().min(1, 'Select the type of property'),

  boundaries: z.object({
    east: optionalText,
    west: optionalText,
    north: optionalText,
    south: optionalText,
  }),

  dimensions: z.object({
    east: sideLength,
    west: sideLength,
    north: sideLength,
    south: sideLength,
  }),
  roadWidth: optionalText,
  roadSide: optionalText,

  floors: z.array(floorSchema).default([]),

  remarks: optionalText,
});

export type SiteVisitFormValues = z.input<typeof siteVisitSchema>;
export type SiteVisitData = z.output<typeof siteVisitSchema>;
export type FloorValues = z.input<typeof floorSchema>;

export const emptyFloor = (name = ''): FloorValues => ({
  name,
  coveredArea: '',
  rooms: '',
  toilets: '',
  kitchens: '',
  others: '',
});
