export type CaseStatus =
  | 'PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'CHECKING'
  | 'QUERY_RAISED'
  | 'APPROVED'
  | 'REJECTED';

export type PropertyType = 'RESIDENTIAL' | 'COMMERCIAL' | 'LAND' | 'INDUSTRIAL';

export interface UserRef {
  id: string;
  name: string;
  email: string;
}

/** Only the report fields the site app reads — the full row carries far more. */
export interface CaseReport {
  id: string;
  engineerId?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  gpsCoordinates?: string | null;
  boundaries?: Record<string, { asPerDocs?: string; asPerSite?: string }> | null;
  dimensions?: Record<string, { asPerDocs?: string; asPerSite?: string }> | null;
  dimensionUnit?: 'ft' | 'm' | null;
  siteVisit?: Record<string, unknown> | null;
  engineerNotes?: string | null;
}

export interface Case {
  id: string;
  caseNumber: string;
  status: CaseStatus;
  customerName: string;
  customerMobile: string;
  propertyLocation: string | null;
  propertyType: PropertyType;
  bankReference: string | null;
  assignedAt: string | null;
  surveyStartedAt: string | null;
  surveyCompletedAt: string | null;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
  institution?: { id: string; name: string; code: string };
  branch?: { id: string; branchName: string; city?: string; address?: string | null } | null;
  assignedTo?: UserRef | null;
  report?: CaseReport | null;
}

export interface CaseListParams {
  limit?: number;
  search?: string;
  status?: CaseStatus;
}

export interface CaseTimelineEvent {
  id: string;
  action: string;
  oldStatus: string | null;
  newStatus: string | null;
  notes: string | null;
  createdAt: string;
  actor: UserRef;
}

export interface CaseTimeline {
  events: CaseTimelineEvent[];
}
