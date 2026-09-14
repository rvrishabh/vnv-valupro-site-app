import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { Case } from '../../types/case.types';
import { ApiEnvelope } from '../../types/common.types';
import { caseQueryKeys } from './caseQueryKeys';

export const useGetCaseByIdQuery = (caseId: string) =>
  useQuery({
    queryKey: caseQueryKeys.byId(caseId),
    queryFn: async (): Promise<Case> => {
      const response = await api.get<ApiEnvelope<Case>>(`/cases/${caseId}`);
      return response.data.data;
    },
    enabled: !!caseId,
  });
