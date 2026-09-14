import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../../api';
import { caseQueryKeys } from '../../queries/cases/caseQueryKeys';
import { ApiEnvelope } from '../../types/common.types';
import { LocalPhoto, PhotoSection, ValuationPhoto } from '../../types/site-visit.types';

export type UploadSitePhotoPayload = {
  valuationId: string;
  photo: LocalPhoto;
  section?: PhotoSection;
};

/**
 * One photo per request, so a weak connection loses at most the photo in
 * flight and the grid can show per-photo progress. The backend re-encodes to
 * JPEG and stores it in R2.
 */
export const useUploadSitePhotoMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      valuationId,
      photo,
      section = 'SITE_VISIT',
    }: UploadSitePhotoPayload): Promise<ValuationPhoto[]> => {
      const formData = new FormData();
      formData.append('files', {
        uri: photo.uri,
        type: photo.type,
        name: photo.fileName,
      } as unknown as Blob);

      try {
        const response = await api.post<ApiEnvelope<ValuationPhoto[]>>(
          `/valuations/${valuationId}/photos`,
          formData,
          { params: { section }, timeout: 90000 },
        );
        return response.data.data;
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Photo upload failed'));
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: caseQueryKeys.photos(variables.valuationId),
      });
    },
  });
};
