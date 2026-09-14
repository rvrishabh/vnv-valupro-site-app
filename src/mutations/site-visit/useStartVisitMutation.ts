import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getApiErrorMessage } from '../../api';
import { caseQueryKeys } from '../../queries/cases/caseQueryKeys';
import { authStore } from '../../stores/authStore';
import { Case, CaseReport } from '../../types/case.types';
import { ApiEnvelope } from '../../types/common.types';

/**
 * Opening a visit does two things the rest of the flow depends on:
 * 1. moves the case ASSIGNED → IN_PROGRESS (records `surveyStartedAt`), and
 * 2. makes sure a valuation exists, since site photos and the visit form are
 *    both stored against the valuation rather than the case.
 */
export const startVisit = async (item: Case): Promise<CaseReport> => {
  if (item.status === 'ASSIGNED') {
    await api.post(`/cases/${item.id}/survey/start`);
  }

  if (item.report) {
    const userId = authStore.getState().user?.id;
    if (item.report.engineerId && userId && item.report.engineerId !== userId) {
      throw new Error(
        'A valuation for this case was opened by someone else. Ask the office to reassign it to you.',
      );
    }
    return item.report;
  }

  const response = await api.post<ApiEnvelope<CaseReport>>('/valuations', {
    caseId: item.id,
  });
  return response.data.data;
};

export const useStartVisitMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: Case) => {
      try {
        return await startVisit(item);
      } catch (error) {
        throw new Error(getApiErrorMessage(error, 'Could not start the visit'));
      }
    },
    // Awaited on success so the form screen opens on a case that already
    // carries the new valuation, rather than flashing "visit not started".
    onSuccess: (_data, item) =>
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.byId(item.id) }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: caseQueryKeys.all });
    },
  });
};
