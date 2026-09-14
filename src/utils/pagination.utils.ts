import { PaginatedResponse } from '../types/common.types';

const normalizeTotal = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
};

export const normalizePaginatedResponse = <T>(
  payload: unknown,
): PaginatedResponse<T> => {
  if (Array.isArray(payload)) {
    return { data: payload as T[], total: payload.length };
  }

  if (!payload || typeof payload !== 'object') {
    return { data: [], total: 0 };
  }

  const record = payload as Record<string, unknown>;

  if (Array.isArray(record.data)) {
    return {
      data: record.data as T[],
      total:
        normalizeTotal(record.total) ??
        normalizeTotal(record.count) ??
        (record.data as T[]).length,
    };
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    if (Array.isArray(nested.data)) {
      return {
        data: nested.data as T[],
        total:
          normalizeTotal(nested.total) ??
          normalizeTotal(record.total) ??
          normalizeTotal(nested.count) ??
          (nested.data as T[]).length,
      };
    }
  }

  if (Array.isArray(record.items)) {
    return {
      data: record.items as T[],
      total:
        normalizeTotal(record.total) ??
        normalizeTotal(record.count) ??
        (record.items as T[]).length,
    };
  }

  return { data: [], total: 0 };
};

export const getInfiniteNextPageParam = <T>(
  lastPage: PaginatedResponse<T>,
  allPages: PaginatedResponse<T>[],
  limit: number,
): number | undefined => {
  const pageItems = Array.isArray(lastPage.data) ? lastPage.data : [];

  if (pageItems.length === 0) {
    return undefined;
  }

  const totalLoaded = allPages.reduce(
    (sum, page) =>
      sum + (Array.isArray(page.data) ? page.data.length : 0),
    0,
  );
  const total =
    normalizeTotal(lastPage.total) ?? normalizeTotal(allPages[0]?.total);

  if (pageItems.length >= limit) {
    return allPages.length + 1;
  }

  if (typeof total === 'number' && totalLoaded < total) {
    return allPages.length + 1;
  }

  return undefined;
};

export const flattenPaginatedPages = <T>(
  pages: PaginatedResponse<T>[] | undefined,
): T[] =>
  pages?.flatMap(page => (Array.isArray(page.data) ? page.data : [])) ?? [];
