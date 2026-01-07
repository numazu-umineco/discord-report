/**
 * Format date and time to Japanese format
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} timeStart - Start time in HH:mm format
 * @param {string} timeEnd - End time in HH:mm format
 * @returns {string} - Formatted datetime string (e.g., "2024年1月15日 14:30〜16:00")
 */
export function formatDateTime(date, timeStart, timeEnd) {
  const [year, month, day] = date.split('-');
  const [hourStart, minuteStart] = timeStart.split(':');
  const [hourEnd, minuteEnd] = timeEnd.split(':');
  return `${year}年${parseInt(month)}月${parseInt(day)}日 ${hourStart}:${minuteStart}〜${hourEnd}:${minuteEnd}`;
}
