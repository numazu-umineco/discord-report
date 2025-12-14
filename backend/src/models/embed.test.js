import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityReportEmbed, createActivityReportEmbed } from './embed.js';

// Mock discord.js to avoid external dependency
vi.mock('../discord.js', () => ({
  getUserAvatarUrl: vi.fn((user) => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
}));

describe('ActivityReportEmbed', () => {
  describe('builder pattern', () => {
    it('should create embed with activity title', () => {
      const embed = new ActivityReportEmbed()
        .setActivity({ name: 'サッカー部' })
        .build();

      expect(embed.title).toBe('サッカー部 活動報告');
    });

    it('should set datetime field', () => {
      const embed = new ActivityReportEmbed()
        .setDateTime('2024-01-15', '14:30')
        .build();

      expect(embed.fields).toContainEqual({
        name: '活動日時',
        value: '2024年1月15日 14:30',
        inline: true
      });
    });

    it('should set participants field', () => {
      const embed = new ActivityReportEmbed()
        .setParticipants(10)
        .build();

      expect(embed.fields).toContainEqual({
        name: '活動人数',
        value: '10名',
        inline: true
      });
    });

    it('should set content field when provided', () => {
      const embed = new ActivityReportEmbed()
        .setContent('今日は練習試合を行いました')
        .build();

      expect(embed.fields).toContainEqual({
        name: '活動内容',
        value: '今日は練習試合を行いました',
        inline: false
      });
    });

    it('should not set content field when empty', () => {
      const embed = new ActivityReportEmbed()
        .setContent('')
        .build();

      expect(embed.fields.find(f => f.name === '活動内容')).toBeUndefined();
    });

    it('should not set content field when whitespace only', () => {
      const embed = new ActivityReportEmbed()
        .setContent('   ')
        .build();

      expect(embed.fields.find(f => f.name === '活動内容')).toBeUndefined();
    });

    it('should set X post URL when valid', () => {
      const embed = new ActivityReportEmbed()
        .setXPostUrl('https://x.com/user/status/123?s=20')
        .build();

      expect(embed.fields).toContainEqual({
        name: 'X (Twitter)',
        value: 'https://x.com/user/status/123',
        inline: false
      });
    });

    it('should not set X post URL when invalid', () => {
      const embed = new ActivityReportEmbed()
        .setXPostUrl('https://example.com/page')
        .build();

      expect(embed.fields.find(f => f.name === 'X (Twitter)')).toBeUndefined();
    });

    it('should set author footer', () => {
      const user = { id: '123', username: 'testuser', avatar: 'abc123' };
      const embed = new ActivityReportEmbed()
        .setAuthor(user)
        .build();

      expect(embed.footer).toEqual({
        text: 'testuser',
        icon_url: 'https://cdn.discordapp.com/avatars/123/abc123.png'
      });
    });

    it('should have default color (Discord blurple)', () => {
      const embed = new ActivityReportEmbed().build();
      expect(embed.color).toBe(0x5865F2);
    });

    it('should have timestamp', () => {
      const embed = new ActivityReportEmbed().build();
      expect(embed.timestamp).toBeDefined();
      expect(() => new Date(embed.timestamp)).not.toThrow();
    });

    it('should support method chaining', () => {
      const embed = new ActivityReportEmbed()
        .setActivity({ name: 'テスト部' })
        .setDateTime('2024-01-01', '10:00')
        .setParticipants(5)
        .setContent('テスト')
        .setAuthor({ id: '1', username: 'user', avatar: 'av' });

      expect(embed).toBeInstanceOf(ActivityReportEmbed);
    });
  });
});

describe('createActivityReportEmbed', () => {
  it('should create complete embed from form data', () => {
    const embed = createActivityReportEmbed({
      activity: { name: 'サッカー部' },
      date: '2024-01-15',
      time: '14:30',
      participants: 10,
      content: '練習試合',
      xPostUrl: 'https://x.com/user/status/123',
      user: { id: '123', username: 'testuser', avatar: 'abc' }
    });

    expect(embed.title).toBe('サッカー部 活動報告');
    expect(embed.fields).toHaveLength(4); // datetime, participants, content, x url
    expect(embed.footer.text).toBe('testuser');
  });

  it('should create embed without optional fields', () => {
    const embed = createActivityReportEmbed({
      activity: { name: 'サッカー部' },
      date: '2024-01-15',
      time: '14:30',
      participants: 10,
      content: null,
      xPostUrl: null,
      user: { id: '123', username: 'testuser', avatar: 'abc' }
    });

    expect(embed.fields).toHaveLength(2); // datetime, participants only
  });
});
