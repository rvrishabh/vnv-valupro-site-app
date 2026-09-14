import { StatusPillVariant } from './statusPill.theme';

export type StatusPillDomain = 'default' | 'visit';

export type ResolvedStatusPill = {
  label: string;
  variant: StatusPillVariant;
};

const formatStatusFallback = (status: string): string =>
  status
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

/** Case lifecycle statuses (backend `CaseStatus`) and the app's visit stages. */
const STATUS_VARIANTS: Record<string, StatusPillVariant> = {
  PENDING: 'muted',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'info',
  CHECKING: 'info',
  QUERY_RAISED: 'destructive',
  APPROVED: 'success',
  REJECTED: 'destructive',
  NEW: 'warning',
  QUERY: 'destructive',
  SUBMITTED: 'success',
  CLOSED: 'muted',
  DRAFT: 'muted',
};

const STATUS_LABELS: Record<string, string> = {
  CHECKING: 'Under Review',
  QUERY_RAISED: 'Query Raised',
  QUERY: 'Query Raised',
};

export function resolveStatusPill(
  status?: string | null,
  _domain: StatusPillDomain = 'default',
): ResolvedStatusPill {
  if (!status || !String(status).trim()) {
    return { label: '—', variant: 'neutral' };
  }

  const normalized = String(status).trim().toUpperCase();

  return {
    label: STATUS_LABELS[normalized] ?? formatStatusFallback(normalized),
    variant: STATUS_VARIANTS[normalized] ?? 'neutral',
  };
}
