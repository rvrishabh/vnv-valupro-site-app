import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { CaseTimeline } from '../../types/case.types';
import { ApiEnvelope } from '../../types/common.types';
import { caseQueryKeys } from './caseQueryKeys';

/** Used to surface the office's query note when a case comes back as QUERY_RAISED. */
export const useGetCaseTimelineQuery = (caseId: string, enabled = true) =>
  useQuery({
    queryKey: caseQueryKeys.timeline(caseId),
    queryFn: async (): Promise<CaseTimeline> => {
      const response = await api.get<ApiEnvelope<CaseTimeline>>(`/cases/${caseId}/timeline`);
      return response.data.data;
    },
    enabled: !!caseId && enabled,
  });
