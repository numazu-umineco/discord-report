import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ActivityReportEmbed, createActivityReportEmbed } from './embed.js';

// Mock discord.js to avoid external dependency
vi.mock('../discord.js', () => ({
  getUserAvatarUrl: vi.fn((user) => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
}));

describe('ActivityReportEmbed', () => {
  describe('builder pattern', () => {
    it('should create embed with activity title including emoji', () => {
      const embed = new ActivityReportEmbed()
        .setActivity({ name: '筋トレ部', emoji: '🏋️' })
        .build();

      expect(embed.title).toBe('🏋️ 筋トレ部');
    });

    it('should create embed with custom activity name without emoji', () => {
      const embed = new ActivityReportEmbed()
        .setActivity({ name: 'その他', emoji: '📝', isCustom: true }, 'カスタム活動')
        .build();

      expect(embed.title).toBe('カスタム活動');
    });

    it('should set datetime field with time range', () => {
      const embed = new ActivityReportEmbed()
        .setDateTime('2024-01-15', '14:30', '16:00')
        .build();

      expect(embed.fields).toContainEqual({
        name: '活動日時',
        value: '2024年1月15日 14:30〜16:00',
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
        .setActivity({ name: 'テスト部', emoji: '🧪' })
        .setDateTime('2024-01-01', '10:00', '12:00')
        .setParticipants(5)
        .setContent('テスト')
        .setAuthor({ id: '1', username: 'user', avatar: 'av' });

      expect(embed).toBeInstanceOf(ActivityReportEmbed);
    });

    it('should set image with attachment URL', () => {
      const embed = new ActivityReportEmbed()
        .setImage('report_123.png')
        .build();

      expect(embed.image).toEqual({
        url: 'attachment://report_123.png'
      });
    });

    it('should not set image when filename is null', () => {
      const embed = new ActivityReportEmbed()
        .setImage(null)
        .build();

      expect(embed.image).toBeUndefined();
    });

    it('should not set image when filename is undefined', () => {
      const embed = new ActivityReportEmbed()
        .setImage(undefined)
        .build();

      expect(embed.image).toBeUndefined();
    });
  });
});

describe('createActivityReportEmbed', () => {
  it('should create complete embed from form data', () => {
    const embed = createActivityReportEmbed({
      activity: { name: '筋トレ部', emoji: '🏋️' },
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: '練習試合',
      xPostUrl: 'https://x.com/user/status/123',
      user: { id: '123', username: 'testuser', avatar: 'abc' }
    });

    expect(embed.title).toBe('🏋️ 筋トレ部');
    expect(embed.fields).toHaveLength(4); // datetime, participants, content, x url
    expect(embed.footer.text).toBe('testuser');
  });

  it('should create embed with custom activity name', () => {
    const embed = createActivityReportEmbed({
      activity: { name: 'その他', emoji: '📝', isCustom: true },
      customActivityName: 'カスタム活動',
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: null,
      xPostUrl: null,
      user: { id: '123', username: 'testuser', avatar: 'abc' }
    });

    expect(embed.title).toBe('カスタム活動');
  });

  it('should create embed without optional fields', () => {
    const embed = createActivityReportEmbed({
      activity: { name: '筋トレ部', emoji: '🏋️' },
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: null,
      xPostUrl: null,
      user: { id: '123', username: 'testuser', avatar: 'abc' }
    });

    expect(embed.fields).toHaveLength(2); // datetime, participants only
  });

  it('should create embed with image attachment', () => {
    const embed = createActivityReportEmbed({
      activity: { name: '筋トレ部', emoji: '🏋️' },
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: null,
      xPostUrl: null,
      user: { id: '123', username: 'testuser', avatar: 'abc' },
      imageFilename: 'report_12345.jpeg'
    });

    expect(embed.image).toEqual({
      url: 'attachment://report_12345.jpeg'
    });
  });

  it('should create embed without image when imageFilename is not provided', () => {
    const embed = createActivityReportEmbed({
      activity: { name: '筋トレ部', emoji: '🏋️' },
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: null,
      xPostUrl: null,
      user: { id: '123', username: 'testuser', avatar: 'abc' }
    });

    expect(embed.image).toBeUndefined();
  });
});
