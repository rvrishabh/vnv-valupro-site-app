import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../../api';
import { Case, CaseListParams } from '../../types/case.types';
import {
  flattenPaginatedPages,
  getInfiniteNextPageParam,
  normalizePaginatedResponse,
} from '../../utils/pagination.utils';
import { caseQueryKeys } from './caseQueryKeys';

/** GET /cases — the backend scopes a SITE_ENGINEER to cases assigned to them. */
export const useGetAssignedCasesInfiniteQuery = ({
  limit = 20,
  search,
  status,
}: CaseListParams = {}) => {
  const query = useInfiniteQuery({
    queryKey: caseQueryKeys.listInfinite({ limit, search, status }),
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      const response = await api.get('/cases', {
        params: {
          page: pageParam,
          limit,
          sort: 'createdAt:desc',
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
      });
      return normalizePaginatedResponse<Case>(response.data);
    },
    getNextPageParam: (lastPage, allPages) =>
      getInfiniteNextPageParam(lastPage, allPages, limit),
  });

  return { ...query, cases: flattenPaginatedPages(query.data?.pages) };
};
