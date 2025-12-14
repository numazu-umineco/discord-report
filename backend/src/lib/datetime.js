/**
 * Format date and time to Japanese format
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {string} time - Time in HH:mm format
 * @returns {string} - Formatted datetime string (e.g., "2024年1月15日 14:30")
 */
export function formatDateTime(date, time) {
  const [year, month, day] = date.split('-');
  const [hour, minute] = time.split(':');
  return `${year}年${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`;
}
