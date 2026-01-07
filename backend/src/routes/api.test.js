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

// Mock config
vi.mock('../config.js', () => ({
  config: {
    discord: {
      allowedGuildId: 'allowed-guild-123',
      allowedRoleId: 'allowed-role-456',
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
      activityId: 'soccer',
      date: '2024-01-15',
      timeStart: '14:30',
      timeEnd: '16:00',
      participants: 10,
      content: 'Test content',
      xPostUrl: 'https://x.com/user/status/123'
    };

    it('should create post with valid data', async () => {
      postEmbedToDiscord.mockResolvedValue({ id: 'message-123' });

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .send(validPostData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.messageId).toBe('message-123');
      expect(postEmbedToDiscord).toHaveBeenCalledWith(
        '新しい活動報告が投稿されました！',
        expect.objectContaining({
          title: 'サッカー部 活動報告'
        })
      );
    });

    it('should create post without optional fields', async () => {
      postEmbedToDiscord.mockResolvedValue({ id: 'message-456' });

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .send({
          activityId: 'soccer',
          date: '2024-01-15',
          timeStart: '14:30',
          timeEnd: '16:00',
          participants: 5
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    describe('validation', () => {
      it('should reject invalid activity id', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, activityId: 'invalid' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid activity is required');
      });

      it('should reject missing activity id', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, activityId: undefined });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid activity is required');
      });

      it('should reject missing date', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, date: undefined });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Date is required');
      });

      it('should reject missing start time', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, timeStart: undefined });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Start time is required');
      });

      it('should reject missing end time', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, timeEnd: undefined });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('End time is required');
      });

      it('should reject invalid participants', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, participants: 'invalid' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid participant count is required');
      });

      it('should reject negative participants', async () => {
        const app = createTestApp(mockUser);
        const res = await request(app)
          .post('/api/posts')
          .send({ ...validPostData, participants: -1 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Valid participant count is required');
      });
    });

    it('should return 500 on Discord API error', async () => {
      postEmbedToDiscord.mockRejectedValue(new Error('Discord API error'));

      const app = createTestApp(mockUser);
      const res = await request(app)
        .post('/api/posts')
        .send(validPostData);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Failed to post message');
    });
  });
});
