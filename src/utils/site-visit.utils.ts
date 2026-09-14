import {
  DIRECTIONS,
  emptyFloor,
  PROPERTY_TYPE_OPTIONS,
  SiteVisitData,
  SiteVisitFormValues,
} from '../schemas/site-visit.schema';
import { Case, CaseReport, PropertyType } from '../types/case.types';
import { todayIsoDate } from './date.utils';

const PROPERTY_TYPE_LABEL: Record<PropertyType, (typeof PROPERTY_TYPE_OPTIONS)[number]> = {
  RESIDENTIAL: 'Residential',
  COMMERCIAL: 'Commercial',
  INDUSTRIAL: 'Industrial',
  LAND: 'Land',
};

export const APP_SOURCE = 'site_engineer_app';

/**
 * Where a case sits from the engineer's side. `surveyCompletedAt` is the
 * milestone that hands the case back to the office; the status alone cannot
 * tell a visit in progress from one already submitted.
 */
export type VisitStage = 'new' | 'in_progress' | 'query' | 'submitted' | 'closed';

export const getVisitStage = (item: Case): VisitStage => {
  if (item.status === 'QUERY_RAISED') {
    return 'query';
  }
  // PENDING only happens to an engineer's case when it was rejected and sent
  // back for reassignment — there is nothing for them to act on.
  if (item.status === 'APPROVED' || item.status === 'REJECTED' || item.status === 'PENDING') {
    return 'closed';
  }
  if (item.surveyCompletedAt || item.status === 'CHECKING') {
    return 'submitted';
  }
  if (item.status === 'IN_PROGRESS' || item.surveyStartedAt) {
    return 'in_progress';
  }
  return 'new';
};

export const VISIT_STAGE_LABEL: Record<VisitStage, string> = {
  new: 'New',
  in_progress: 'In Progress',
  query: 'Query Raised',
  submitted: 'Submitted',
  closed: 'Closed',
};

export const isVisitEditable = (item: Case) => {
  const stage = getVisitStage(item);
  return stage === 'in_progress' || stage === 'query';
};

const bankLabel = (item: Case) =>
  [item.institution?.name, item.branch?.branchName].filter(Boolean).join(', ');

/** Blank form prefilled from what the office already entered on the case. */
export const buildDefaultValues = (item: Case): SiteVisitFormValues => ({
  visitDate: todayIsoDate(),
  bankName: bankLabel(item),
  ownerName: item.customerName ?? '',
  addressAsPerSite: item.propertyLocation ?? '',
  personMetName: '',
  personMetMobile: '',
  landmark: '',
  meterNumber: '',
  meterStatus: '',
  gpsCoordinates: item.report?.gpsCoordinates ?? '',
  authority: '',
  occupiedBy: '',
  occupancy: '',
  communityDominated: '',
  highTension: '',
  rateByOwner: '',
  rateByLocals: '',
  propertyDealerRef: '',
  structureTypes: [],
  ageOfProperty: '',
  typeOfProperty: item.propertyType ? PROPERTY_TYPE_LABEL[item.propertyType] : '',
  boundaries: { east: '', west: '', north: '', south: '' },
  dimensions: { east: '', west: '', north: '', south: '' },
  roadWidth: '',
  roadSide: '',
  floors: item.propertyType === 'LAND' ? [] : [emptyFloor('Ground Floor')],
  remarks: '',
});

/**
 * A form previously sent from the app is stored verbatim, so it round-trips;
 * anything missing (older payloads, office edits) falls back to the defaults.
 */
export const buildInitialValues = (item: Case): SiteVisitFormValues => {
  const defaults = buildDefaultValues(item);
  const saved = item.report?.siteVisit as Partial<SiteVisitFormValues> | null | undefined;
  if (!saved || typeof saved !== 'object') {
    return defaults;
  }
  return {
    ...defaults,
    ...saved,
    boundaries: { ...defaults.boundaries, ...(saved.boundaries ?? {}) },
    dimensions: { ...defaults.dimensions, ...(saved.dimensions ?? {}) },
    floors: Array.isArray(saved.floors) ? saved.floors : defaults.floors,
    structureTypes: Array.isArray(saved.structureTypes)
      ? saved.structureTypes
      : defaults.structureTypes,
  };
};

const FEET_TO_METRES = 0.3048;

/**
 * PATCH /valuations/:id body. JSON sections are replaced wholesale by the
 * backend, so `boundaries`/`dimensions` are merged with what is already there
 * — the office fills the "as per documents" column of the same objects.
 *
 * Both dimension columns share one `dimensionUnit`. The engineer measures in
 * feet; if the office has already switched the valuation to metres, the site
 * sides are converted rather than flipping the unit under the deed figures.
 */
export const toValuationPayload = (
  values: SiteVisitData,
  report: CaseReport | null | undefined,
  options: { final: boolean },
) => {
  const boundaries: Record<string, { asPerDocs?: string; asPerSite?: string }> = {
    ...(report?.boundaries ?? {}),
  };
  const dimensions: Record<string, { asPerDocs?: string; asPerSite?: string }> = {
    ...(report?.dimensions ?? {}),
  };

  const inMetres = report?.dimensionUnit === 'm';

  DIRECTIONS.forEach(direction => {
    const boundary = values.boundaries[direction];
    if (boundary) {
      boundaries[direction] = { ...boundaries[direction], asPerSite: boundary };
    }
    const side = values.dimensions[direction];
    if (side) {
      const asPerSite = inMetres ? (Number(side) * FEET_TO_METRES).toFixed(2) : side;
      dimensions[direction] = { ...dimensions[direction], asPerSite };
    }
  });

  return {
    gpsCoordinates: values.gpsCoordinates || undefined,
    boundaries,
    dimensions,
    ...(inMetres ? {} : { dimensionUnit: 'ft' as const }),
    engineerNotes: values.remarks || undefined,
    siteVisit: {
      ...values,
      source: APP_SOURCE,
      status: options.final ? 'SUBMITTED' : 'DRAFT',
      savedAt: new Date().toISOString(),
    },
  };
};
