import { describe, it, expect } from 'vitest';
import {
  escapeMentions,
  escapeMarkdown,
  truncate,
  sanitizeTitle,
  sanitizeFieldValue,
  EMBED_LIMITS
} from './sanitize.js';

describe('escapeMentions', () => {
  it('should escape @everyone', () => {
    expect(escapeMentions('Hello @everyone!')).toBe('Hello @\u200Beveryone!');
  });

  it('should escape @here', () => {
    expect(escapeMentions('Alert @here now')).toBe('Alert @\u200Bhere now');
  });

  it('should escape @everyone case-insensitively', () => {
    expect(escapeMentions('@EVERYONE @Everyone')).toBe('@\u200BEVERYONE @\u200BEveryone');
  });

  it('should escape user mentions', () => {
    expect(escapeMentions('Hi <@123456789>!')).toBe('Hi <@\u200B123456789>!');
    expect(escapeMentions('Hi <@!123456789>!')).toBe('Hi <@\u200B123456789>!');
  });

  it('should escape role mentions', () => {
    expect(escapeMentions('Ping <@&987654321>')).toBe('Ping <@\u200B&987654321>');
  });

  it('should handle multiple mentions', () => {
    const input = '@everyone <@123> <@&456> @here';
    const expected = '@\u200Beveryone <@\u200B123> <@\u200B&456> @\u200Bhere';
    expect(escapeMentions(input)).toBe(expected);
  });

  it('should return null/undefined as-is', () => {
    expect(escapeMentions(null)).toBeNull();
    expect(escapeMentions(undefined)).toBeUndefined();
  });

  it('should return empty string as-is', () => {
    expect(escapeMentions('')).toBe('');
  });
});

describe('escapeMarkdown', () => {
  it('should escape asterisks', () => {
    expect(escapeMarkdown('*bold*')).toBe('\\*bold\\*');
  });

  it('should escape underscores', () => {
    expect(escapeMarkdown('_italic_')).toBe('\\_italic\\_');
  });

  it('should escape tildes', () => {
    expect(escapeMarkdown('~~strike~~')).toBe('\\~\\~strike\\~\\~');
  });

  it('should escape backticks', () => {
    expect(escapeMarkdown('`code`')).toBe('\\`code\\`');
  });

  it('should escape pipes', () => {
    expect(escapeMarkdown('||spoiler||')).toBe('\\|\\|spoiler\\|\\|');
  });

  it('should escape backslashes', () => {
    expect(escapeMarkdown('back\\slash')).toBe('back\\\\slash');
  });

  it('should escape greater-than signs', () => {
    expect(escapeMarkdown('> quote')).toBe('\\> quote');
  });

  it('should escape hash signs', () => {
    expect(escapeMarkdown('# heading')).toBe('\\# heading');
  });

  it('should handle null/undefined', () => {
    expect(escapeMarkdown(null)).toBeNull();
    expect(escapeMarkdown(undefined)).toBeUndefined();
  });
});

describe('truncate', () => {
  it('should not truncate short text', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long text with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello w…');
  });

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('should handle null/undefined', () => {
    expect(truncate(null, 10)).toBeNull();
    expect(truncate(undefined, 10)).toBeUndefined();
  });
});

describe('sanitizeTitle', () => {
  it('should escape mentions and markdown', () => {
    const input = '*Bold* @everyone test';
    const result = sanitizeTitle(input);
    expect(result).toContain('\\*');
    expect(result).toContain('@\u200Beveryone');
  });

  it('should truncate to 256 characters', () => {
    const longText = 'a'.repeat(300);
    const result = sanitizeTitle(longText);
    expect(result.length).toBe(EMBED_LIMITS.title);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should handle normal text without changes', () => {
    expect(sanitizeTitle('Normal activity name')).toBe('Normal activity name');
  });
});

describe('sanitizeFieldValue', () => {
  it('should escape mentions but preserve markdown', () => {
    const input = '*Bold* @everyone test';
    const result = sanitizeFieldValue(input);
    expect(result).toContain('*Bold*'); // markdown preserved
    expect(result).toContain('@\u200Beveryone'); // mention escaped
  });

  it('should truncate to 1024 characters', () => {
    const longText = 'a'.repeat(1100);
    const result = sanitizeFieldValue(longText);
    expect(result.length).toBe(EMBED_LIMITS.fieldValue);
    expect(result.endsWith('…')).toBe(true);
  });
});
