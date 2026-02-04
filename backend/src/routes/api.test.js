import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import { passport } from '../auth.js';
import apiRoutes from './api.js';

// Mock discord.js
vi.mock('../discord.js', () => ({
  postEmbedToDiscord: vi.fn(),
  getUserAvatarUrl: vi.fn((user) => `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`)
}));

// Mock fixupx
vi.mock('../lib/fixupx.js', () => ({
  fetchXPostMetadata: vi.fn(),
  buildXPostEmbed: vi.fn()
}));

// Mock config
vi.mock('../config.js', () => ({
  config: {
    discord: {
      allowedGuildId: 'allowed-guild-123',
      allowedRoleIds: ['allowed-role-456'],
      postChannelId: 'channel-789'
    }
  }
}));

// Mock auth middleware
vi.mock('../auth.js', () => ({
  passport: {
    initialize: () => (req, res, next) => next(),
    session: () => (req, res, next) => next()
  },
  requireAuthorization: vi.fn((req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    next();
  }),
  checkUserAccess: vi.fn()
}));

import { postEmbedToDiscord } from '../discord.js';
import { fetchXPostMetadata, buildXPostEmbed } from '../lib/fixupx.js';
import { requireAuthorization } from '../auth.js';

function createTestApp(user = null) {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));

  // Mock authentication
  app.use((req, res, next) => {
    req.user = user;
    req.isAuthenticated = () => !!user;
    next();
  });

  app.use('/api', apiRoutes);
  return app;
}

describe('API Routes', () => {
  const mockUser = {
    id: '123456',
    username: 'testuser',
    avatar: 'abc123',
    guilds: [
      { id: 'allowed-guild-123', name: 'Test Guild' },
      { id: 'other-guild', name: 'Other Guild' }
    ],
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/activities', () => {
    it('should return list of activities', async () => {
      const app = createTestApp(mockUser);
      const res = await request(app).get('/api/activities');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  describe('POST /api/posts', () => {
    const validPostData = {
      activityId: 'muscle',
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: 'Test content',
      xPostUrl: 'https://x.com/user/status/123'
    };

    it('should create post with valid data', async () => {
      postEmbedToDiscord.mockResolvedValue({ id: 'message-123' });
      fetchXPostMetadata.mockResolvedValue(null);

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .field('activityId', validPostData.activityId)
        .field('date', validPostData.date)
        .field('timeStart', validPostData.timeStart)
        .field('timeEnd', validPostData.timeEnd)
        .field('participants', validPostData.participants)
        .field('content', validPostData.content)
        .field('xPostUrl', validPostData.xPostUrl);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messageId).toBe('message-123');
      expect(postEmbedToDiscord).toHaveBeenCalledWith(
        '新しい活動報告が投稿されました！',
        expect.arrayContaining([
          expect.objectContaining({
            title: '🏋️ 筋トレ部'
          })
        ]),
        null
      );
    });

    it('should create post without optional fields', async () => {
      postEmbedToDiscord.mockResolvedValue({ id: 'message-456' });

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .field('activityId', 'muscle')
        .field('date', '2024-01-15')
        .field('timeStart', '14:30')
        .field('timeEnd', '16:00')
        .field('participants', '5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should create post with custom activity name', async () => {
      postEmbedToDiscord.mockResolvedValue({ id: 'message-custom' });

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .field('activityId', 'other')
        .field('customActivityName', 'カスタム活動')
        .field('date', '2024-01-15')
        .field('timeStart', '14:30')
        .field('timeEnd', '16:00')
        .field('participants', '5');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(postEmbedToDiscord).toHaveBeenCalledWith(
        '新しい活動報告が投稿されました！',
        expect.arrayContaining([
          expect.objectContaining({
            title: 'カスタム活動'
          })
        ]),
        null
      );
    });

    it('should reject other activity without custom name', async () => {
      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .field('activityId', 'other')
        .field('date', '2024-01-15')
        .field('timeStart', '14:30')
        .field('timeEnd', '16:00')
        .field('participants', '5');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Custom activity name is required');
    });

    it('should create post with image attachment', async () => {
      postEmbedToDiscord.mockResolvedValue({ id: 'message-with-image' });

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .field('activityId', 'muscle')
        .field('date', '2024-01-15')
        .field('timeStart', '14:30')
        .field('timeEnd', '16:00')
        .field('participants', '10')
        .attach('image', Buffer.from('fake image data'), {
          filename: 'test.jpg',
          contentType: 'image/jpeg'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(postEmbedToDiscord).toHaveBeenCalledWith(
        '新しい活動報告が投稿されました！',
        expect.arrayContaining([
          expect.objectContaining({
            image: expect.objectContaining({
              url: expect.stringMatching(/^attachment:\/\/report_\d+\.jpeg$/)
            })
          })
        ]),
        expect.objectContaining({
          buffer: expect.any(Buffer),
          filename: expect.stringMatching(/^report_\d+\.jpeg$/),
          contentType: 'image/jpeg'
        })
      );
    });

    describe('validation', () => {
      it('should reject invalid activity id', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', 'invalid')
          .field('date', validPostData.date)
          .field('timeStart', validPostData.timeStart)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', validPostData.participants);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid activity is required');
      });

      it('should reject missing activity id', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('date', validPostData.date)
          .field('timeStart', validPostData.timeStart)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', validPostData.participants);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid activity is required');
      });

      it('should reject missing date', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', validPostData.activityId)
          .field('timeStart', validPostData.timeStart)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', validPostData.participants);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Date is required');
      });

      it('should reject missing start time', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', validPostData.activityId)
          .field('date', validPostData.date)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', validPostData.participants);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Start time is required');
      });

      it('should reject missing end time', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', validPostData.activityId)
          .field('date', validPostData.date)
          .field('timeStart', validPostData.timeStart)
          .field('participants', validPostData.participants);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('End time is required');
      });

      it('should reject invalid participants', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', validPostData.activityId)
          .field('date', validPostData.date)
          .field('timeStart', validPostData.timeStart)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', 'invalid');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid participant count is required');
      });

      it('should reject negative participants', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', validPostData.activityId)
          .field('date', validPostData.date)
          .field('timeStart', validPostData.timeStart)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', '-1');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid participant count is required');
      });

      it('should reject non-image files', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', validPostData.activityId)
          .field('date', validPostData.date)
          .field('timeStart', validPostData.timeStart)
          .field('timeEnd', validPostData.timeEnd)
          .field('participants', validPostData.participants)
          .attach('image', Buffer.from('not an image'), {
            filename: 'test.txt',
            contentType: 'text/plain'
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('画像形式が無効です');
      });
    });

    describe('X post embed integration', () => {
      it('should include X post embed when metadata is available', async () => {
        const mockXEmbeds = [
          {
            color: 0x1D9BF0,
            url: 'https://x.com/testuser/status/123',
            author: { name: 'TestUser (@testuser)' },
            description: 'Test tweet'
          }
        ];
        fetchXPostMetadata.mockResolvedValue({
          title: 'TestUser (@testuser)',
          description: 'Test tweet',
          images: [],
          originalUrl: 'https://x.com/testuser/status/123',
          profileImageUrl: null
        });
        buildXPostEmbed.mockReturnValue(mockXEmbeds);
        postEmbedToDiscord.mockResolvedValue({ id: 'message-with-x' });

        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', 'muscle')
          .field('date', '2024-01-15')
          .field('timeStart', '14:30')
          .field('timeEnd', '16:00')
          .field('participants', '5')
          .field('xPostUrl', 'https://x.com/testuser/status/123');

        expect(res.status).toBe(200);
        const embedsArg = postEmbedToDiscord.mock.calls[0][1];
        expect(embedsArg).toHaveLength(2);
        expect(embedsArg[0]).toEqual(expect.objectContaining({ title: '🏋️ 筋トレ部' }));
        expect(embedsArg[1]).toEqual(mockXEmbeds[0]);
      });

      it('should post only activity embed when fixupx fetch fails', async () => {
        fetchXPostMetadata.mockRejectedValue(new Error('Network error'));
        postEmbedToDiscord.mockResolvedValue({ id: 'message-no-x' });

        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', 'muscle')
          .field('date', '2024-01-15')
          .field('timeStart', '14:30')
          .field('timeEnd', '16:00')
          .field('participants', '5')
          .field('xPostUrl', 'https://x.com/testuser/status/123');

        expect(res.status).toBe(200);
        const embedsArg = postEmbedToDiscord.mock.calls[0][1];
        expect(embedsArg).toHaveLength(1);
      });

      it('should post only activity embed when metadata returns null', async () => {
        fetchXPostMetadata.mockResolvedValue(null);
        buildXPostEmbed.mockReturnValue(null);
        postEmbedToDiscord.mockResolvedValue({ id: 'message-no-x' });

        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .field('activityId', 'muscle')
          .field('date', '2024-01-15')
          .field('timeStart', '14:30')
          .field('timeEnd', '16:00')
          .field('participants', '5')
          .field('xPostUrl', 'https://x.com/testuser/status/123');

        expect(res.status).toBe(200);
        const embedsArg = postEmbedToDiscord.mock.calls[0][1];
        expect(embedsArg).toHaveLength(1);
      });
    });

    it('should return 500 on Discord API error', async () => {
      postEmbedToDiscord.mockRejectedValue(new Error('Discord API error'));

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .field('activityId', validPostData.activityId)
        .field('date', validPostData.date)
        .field('timeStart', validPostData.timeStart)
        .field('timeEnd', validPostData.timeEnd)
        .field('participants', validPostData.participants);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to post message');
    });
  });
});
