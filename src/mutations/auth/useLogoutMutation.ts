import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authStore } from '../../stores/authStore';
import { clearAllSiteVisitDrafts } from '../../services/storage/siteVisitDraftStorage';

/** JWTs are stateless on the backend — logging out just discards them locally. */
export const useLogoutMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await clearAllSiteVisitDrafts();
    },
    onSettled: async () => {
      await authStore.setUnauthenticated();
      queryClient.clear();
    },
  });
};
