import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../../api';
import { caseQueryKeys } from '../../queries/cases/caseQueryKeys';
import { ValuationPhoto } from '../../types/site-visit.types';

export const useDeleteSitePhotoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valuationId, photoId }: { valuationId: string; photoId: string }) => {
      try {
        await api.delete(`/valuations/${valuationId}/photos/${photoId}`);
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Could not remove the photo'));
      }
    },
    onMutate: async ({ valuationId, photoId }) => {
      const key = caseQueryKeys.photos(valuationId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ValuationPhoto[]>(key);
      queryClient.setQueryData<ValuationPhoto[]>(key, photos =>
        (photos ?? []).filter(photo => photo.id !== photoId),
      );
      return { previous };
    },
    onError: (_error, { valuationId }, context) => {
      queryClient.setQueryData(caseQueryKeys.photos(valuationId), context?.previous);
    },
    onSettled: (_data, _error, { valuationId }) => {
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.photos(valuationId) });
    },
  });
};
