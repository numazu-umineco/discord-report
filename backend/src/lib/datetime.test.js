import { describe, it, expect } from 'vitest';
import { formatDateTime } from './datetime.js';

describe('formatDateTime', () => {
  it('should format date and time range to Japanese format', () => {
    expect(formatDateTime('2024-01-15', '14:30', '16:00')).toBe('2024年1月15日 14:30〜16:00');
  });

  it('should remove leading zeros from month and day', () => {
    expect(formatDateTime('2024-03-05', '09:00', '12:00')).toBe('2024年3月5日 09:00〜12:00');
  });

  it('should handle December correctly', () => {
    expect(formatDateTime('2024-12-25', '18:00', '20:00')).toBe('2024年12月25日 18:00〜20:00');
  });

  it('should handle single digit month and day', () => {
    expect(formatDateTime('2024-01-01', '00:00', '01:00')).toBe('2024年1月1日 00:00〜01:00');
  });

  it('should preserve time format as-is', () => {
    expect(formatDateTime('2024-06-10', '23:00', '23:59')).toBe('2024年6月10日 23:00〜23:59');
  });
});
