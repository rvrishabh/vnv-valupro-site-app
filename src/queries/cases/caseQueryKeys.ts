import { CaseListParams } from '../../types/case.types';

export const caseQueryKeys = {
  all: ['cases'] as const,
  listInfinite: (params: CaseListParams) => ['cases', 'infinite', params] as const,
  byId: (caseId: string) => ['cases', caseId] as const,
  timeline: (caseId: string) => ['cases', caseId, 'timeline'] as const,
  photos: (valuationId: string) => ['valuations', valuationId, 'photos'] as const,
};
