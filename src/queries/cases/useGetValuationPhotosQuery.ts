import { useQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { ApiEnvelope } from '../../types/common.types';
import { ValuationPhoto } from '../../types/site-visit.types';
import { caseQueryKeys } from './caseQueryKeys';

export const useGetValuationPhotosQuery = (valuationId?: string | null) =>
  useQuery({
    queryKey: caseQueryKeys.photos(valuationId ?? ''),
    queryFn: async (): Promise<ValuationPhoto[]> => {
      const response = await api.get<ApiEnvelope<ValuationPhoto[]>>(
        `/valuations/${valuationId}/photos`,
      );
      return response.data.data ?? [];
    },
    enabled: !!valuationId,
  });
