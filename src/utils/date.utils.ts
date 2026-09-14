import { format, isValid, parseISO } from 'date-fns';

export const DATE_FORMAT = {
  /** e.g. 02 Jun 2026 */
  display: 'dd MMM yyyy',
  /** e.g. 02 Jun 2026, 2:30 PM */
  displayDateTime: 'dd MMM yyyy, h:mm a',
  /** ISO calendar date stored in the visit form */
  isoDate: 'yyyy-MM-dd',
} as const;

const toDate = (value?: string | Date | null): Date | null => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
};

export const formatDisplayDate = (value?: string | Date | null, fallback = '—') => {
  const date = toDate(value);
  return date ? format(date, DATE_FORMAT.display) : fallback;
};

export const formatDisplayDateTime = (value?: string | Date | null, fallback = '—') => {
  const date = toDate(value);
  return date ? format(date, DATE_FORMAT.displayDateTime) : fallback;
};

export const todayIsoDate = () => format(new Date(), DATE_FORMAT.isoDate);
