import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../../api';
import { caseQueryKeys } from '../../queries/cases/caseQueryKeys';
import { SiteVisitData } from '../../schemas/site-visit.schema';
import { removeSiteVisitDraft } from '../../services/storage/siteVisitDraftStorage';
import { Case } from '../../types/case.types';
import { toValuationPayload } from '../../utils/site-visit.utils';

export type SaveSiteVisitPayload = {
  item: Case;
  valuationId: string;
  values: SiteVisitData;
  /** `true` submits the visit back to the office; `false` only saves a draft. */
  final: boolean;
};

export const useSaveSiteVisitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ item, valuationId, values, final }: SaveSiteVisitPayload) => {
      try {
        await api.patch(
          `/valuations/${valuationId}`,
          toValuationPayload(values, item.report, { final }),
        );

        // Completing is a one-time milestone on the backend; a resubmission
        // after a query only updates the valuation.
        if (final && !item.surveyCompletedAt) {
          await api.post(`/cases/${item.id}/survey/complete`, {
            notes: values.remarks || undefined,
          });
        }
      } catch (error) {
        throw new Error(
          getApiErrorMessage(error, final ? 'Could not submit the visit' : 'Could not save the draft'),
        );
      }

      if (final) {
        await removeSiteVisitDraft(item.id);
      }
    },
    onSuccess: (_data, { item }) => {
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.byId(item.id) });
    },
  });
};
