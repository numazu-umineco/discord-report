import { describe, it, expect } from 'vitest';
import { getActivities, getActivityById, isValidActivityId } from './activities.js';

describe('activities', () => {
  describe('getActivities', () => {
    it('should return array of activities', () => {
      const activities = getActivities();
      expect(Array.isArray(activities)).toBe(true);
      expect(activities.length).toBeGreaterThan(0);
    });

    it('should return activities with id and name properties', () => {
      const activities = getActivities();
      activities.forEach(activity => {
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('name');
        expect(typeof activity.id).toBe('string');
        expect(typeof activity.name).toBe('string');
      });
    });

    it('should include expected activities', () => {
      const activities = getActivities();
      const ids = activities.map(a => a.id);
      expect(ids).toContain('soccer');
      expect(ids).toContain('baseball');
      expect(ids).toContain('basketball');
    });
  });

  describe('getActivityById', () => {
    it('should return activity for valid id', () => {
      const activity = getActivityById('soccer');
      expect(activity).toEqual({ id: 'soccer', name: 'サッカー部' });
    });

    it('should return null for invalid id', () => {
      expect(getActivityById('nonexistent')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(getActivityById('')).toBeNull();
    });

    it('should return null for null/undefined', () => {
      expect(getActivityById(null)).toBeNull();
      expect(getActivityById(undefined)).toBeNull();
    });
  });

  describe('isValidActivityId', () => {
    it('should return true for valid activity id', () => {
      expect(isValidActivityId('soccer')).toBe(true);
      expect(isValidActivityId('baseball')).toBe(true);
      expect(isValidActivityId('computer')).toBe(true);
    });

    it('should return false for invalid activity id', () => {
      expect(isValidActivityId('nonexistent')).toBe(false);
      expect(isValidActivityId('invalid')).toBe(false);
    });

    it('should return false for empty/null/undefined', () => {
      expect(isValidActivityId('')).toBe(false);
      expect(isValidActivityId(null)).toBe(false);
      expect(isValidActivityId(undefined)).toBe(false);
    });
  });
});
