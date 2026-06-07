/**
 * Calculates start and end Date objects in UTC corresponding to the local day bounds in Vietnam timezone (Asia/Ho_Chi_Minh / UTC+7).
 */
export function getVietnamDayBounds(dateStr?: string | null) {
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    const start = new Date(Date.UTC(y, m - 1, d, 0 - 7, 0, 0, 0));
    const end = new Date(Date.UTC(y, m - 1, d, 23 - 7, 59, 59, 999));
    return { start, end };
  }

  let targetDate = dateStr ? new Date(dateStr) : new Date();

  // Fallback to Intl.DateTimeFormat for other formats or current date
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  
  const parts = formatter.formatToParts(targetDate);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed month
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  const start = new Date(Date.UTC(year, month, day, 0 - 7, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, day, 23 - 7, 59, 59, 999));

  return { start, end };
}

/**
 * Calculates the start and end Date objects in UTC corresponding to the current month bounds in Vietnam timezone.
 */
export function getVietnamMonthBounds(dateStr?: string | null) {
  let targetDate = dateStr ? new Date(dateStr) : new Date();

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
  });
  
  const parts = formatter.formatToParts(targetDate);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1; // 0-indexed month

  const start = new Date(Date.UTC(year, month, 1, 0 - 7, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 23 - 7, 59, 59, 999));

  return { start, end };
}
