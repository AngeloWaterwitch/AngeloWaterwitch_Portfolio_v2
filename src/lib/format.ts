export const PROJECT_STATUS_LABEL: Record<string, string> = {
  QUOTED: 'Quote sent',
  DEPOSIT_PENDING: 'Awaiting deposit',
  IN_PROGRESS: 'In progress',
  IN_REVIEW: 'In review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export function formatRands(cents: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency }).format(cents / 100);
}

const TZ = 'Africa/Johannesburg';

export function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ });
}

export function formatDateTime(d: Date | string): string {
  return new Date(d).toLocaleString('en-ZA', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TZ,
  });
}
