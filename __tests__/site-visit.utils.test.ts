import { siteVisitSchema } from '../src/schemas/site-visit.schema';
import { Case } from '../src/types/case.types';
import {
  buildDefaultValues,
  buildInitialValues,
  getVisitStage,
  toValuationPayload,
} from '../src/utils/site-visit.utils';

const baseCase: Case = {
  id: 'case-1',
  caseNumber: 'CANARA/2026/0007',
  status: 'ASSIGNED',
  customerName: 'Smt. Mukta Agarwal',
  customerMobile: '9412734044',
  propertyLocation: 'House no. 81A, Anuna Nagar, Etah',
  propertyType: 'RESIDENTIAL',
  bankReference: null,
  assignedAt: '2026-06-01T10:00:00.000Z',
  surveyStartedAt: null,
  surveyCompletedAt: null,
  deadline: null,
  createdAt: '2026-06-01T09:00:00.000Z',
  updatedAt: '2026-06-01T10:00:00.000Z',
  institution: { id: 'i1', name: 'Canara Bank', code: 'CANARA' },
  branch: { id: 'b1', branchName: 'MSME Etah' },
  report: null,
};

describe('getVisitStage', () => {
  it('maps the case lifecycle onto what the engineer has to do', () => {
    expect(getVisitStage(baseCase)).toBe('new');
    expect(getVisitStage({ ...baseCase, status: 'IN_PROGRESS', surveyStartedAt: 'x' })).toBe('in_progress');
    expect(
      getVisitStage({ ...baseCase, status: 'IN_PROGRESS', surveyStartedAt: 'x', surveyCompletedAt: 'y' }),
    ).toBe('submitted');
    expect(getVisitStage({ ...baseCase, status: 'QUERY_RAISED', surveyCompletedAt: 'y' })).toBe('query');
    expect(getVisitStage({ ...baseCase, status: 'PENDING' })).toBe('closed');
  });
});

describe('buildInitialValues', () => {
  it('prefills from the case when nothing has been saved yet', () => {
    const values = buildDefaultValues(baseCase);
    expect(values.ownerName).toBe('Smt. Mukta Agarwal');
    expect(values.bankName).toBe('Canara Bank, MSME Etah');
    expect(values.typeOfProperty).toBe('Residential');
    expect(values.floors).toHaveLength(1);
  });

  it('round-trips a form previously saved from the app', () => {
    const values = buildInitialValues({
      ...baseCase,
      report: {
        id: 'v1',
        status: 'DRAFT',
        siteVisit: { personMetName: 'Subhang', boundaries: { east: 'House of Girisa Misra' } },
      },
    });
    expect(values.personMetName).toBe('Subhang');
    expect(values.boundaries).toEqual({ east: 'House of Girisa Misra', west: '', north: '', south: '' });
  });
});

describe('toValuationPayload', () => {
  const filled = siteVisitSchema.parse({
    ...buildDefaultValues(baseCase),
    personMetName: 'Subhang',
    gpsCoordinates: '27.565146, 78.652088',
    boundaries: { east: 'House of Girisa Misra', west: '', north: '', south: '36 ft wide road' },
    dimensions: { east: '110', west: '110', north: '30', south: '30' },
    remarks: 'Road on south',
  });

  it('keeps the office "as per documents" column when writing site values', () => {
    const payload = toValuationPayload(
      filled,
      {
        id: 'v1',
        status: 'DRAFT',
        boundaries: { east: { asPerDocs: 'Plot of X' } },
      },
      { final: true },
    );
    expect(payload.boundaries.east).toEqual({ asPerDocs: 'Plot of X', asPerSite: 'House of Girisa Misra' });
    expect(payload.boundaries.west).toBeUndefined();
    expect(payload.gpsCoordinates).toBe('27.565146, 78.652088');
    expect(payload.engineerNotes).toBe('Road on south');
    expect(payload.dimensionUnit).toBe('ft');
    expect(payload.siteVisit.status).toBe('SUBMITTED');
  });

  it('converts site sides to metres instead of overriding a metre valuation', () => {
    const payload = toValuationPayload(
      filled,
      { id: 'v1', status: 'DRAFT', dimensionUnit: 'm' },
      { final: false },
    );
    expect(payload.dimensionUnit).toBeUndefined();
    expect(payload.dimensions.east?.asPerSite).toBe('33.53');
    expect(payload.siteVisit.status).toBe('DRAFT');
  });
});

describe('siteVisitSchema', () => {
  it('requires the fields the paper form cannot go without', () => {
    const result = siteVisitSchema.safeParse({ ...buildDefaultValues(baseCase), personMetName: '' });
    expect(result.success).toBe(false);
    const paths = result.success ? [] : result.error.issues.map(issue => issue.path.join('.'));
    expect(paths).toEqual(expect.arrayContaining(['personMetName', 'gpsCoordinates']));
  });
});
