import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import session from 'express-session';
import authRoutes from './auth.js';

// Mock config
vi.mock('../config.js', () => ({
  config: {
    discord: {
      allowedGuildId: 'allowed-guild-123',
      allowedRoleIds: ['allowed-role-456']
    },
    frontendUrl: 'http://localhost:5173'
  }
}));

// Mock auth module
vi.mock('../auth.js', () => ({
  passport: {
    initialize: () => (req, res, next) => next(),
    session: () => (req, res, next) => next(),
    authenticate: vi.fn(() => (req, res, next) => next())
  },
  checkUserAccessWithCache: vi.fn()
}));

import { checkUserAccessWithCache } from '../auth.js';

function createTestApp(user = null) {
  const app = express();
  app.use(express.json());
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false
  }));

  // Mock authentication state
  app.use((req, res, next) => {
    req.user = user;
    req.isAuthenticated = () => !!user;
    req.logout = (cb) => cb(null);
    next();
  });

  app.use('/auth', authRoutes);
  return app;
}

describe('Auth Routes', () => {
  const mockUser = {
    id: '123456',
    username: 'testuser',
    avatar: 'abc123',
    guilds: [{ id: 'allowed-guild-123', name: 'Test Guild' }],
    accessToken: 'mock-token',
    refreshToken: 'mock-refresh'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /auth/status', () => {
    it('should return authenticated: false when not logged in', async () => {
      const app = createTestApp(null);
      const res = await request(app).get('/auth/status');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ authenticated: false });
    });

    it('should return authenticated: true and authorized: true for authorized user', async () => {
      checkUserAccessWithCache.mockResolvedValue({ authorized: true, error: null });

      const app = createTestApp(mockUser);
      const res = await request(app).get('/auth/status');

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.authorized).toBe(true);
      expect(res.body.error).toBeNull();
    });

    it('should return authorized: false with error for unauthorized user', async () => {
      checkUserAccessWithCache.mockResolvedValue({
        authorized: false,
        error: 'NOT_IN_GUILD'
      });

      const app = createTestApp(mockUser);
      const res = await request(app).get('/auth/status');

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.authorized).toBe(false);
      expect(res.body.error).toBe('NOT_IN_GUILD');
    });

    it('should not expose tokens or guilds in response', async () => {
      checkUserAccessWithCache.mockResolvedValue({ authorized: true, error: null });

      const app = createTestApp(mockUser);
      const res = await request(app).get('/auth/status');

      expect(res.body.user.accessToken).toBeUndefined();
      expect(res.body.user.refreshToken).toBeUndefined();
      expect(res.body.user.guilds).toBeUndefined();
      expect(res.body.user.id).toBe('123456');
      expect(res.body.user.username).toBe('testuser');
    });
  });

  describe('GET /auth/failed', () => {
    it('should return 401 with error message', async () => {
      const app = createTestApp(null);
      const res = await request(app).get('/auth/failed');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Authentication failed');
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout successfully', async () => {
      const app = createTestApp(mockUser);
      const res = await request(app).get('/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Logged out successfully');
    });

    it('should handle logout error', async () => {
      const app = express();
      app.use(express.json());
      app.use(session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false
      }));
      app.use((req, res, next) => {
        req.user = mockUser;
        req.isAuthenticated = () => true;
        req.logout = (cb) => cb(new Error('Logout failed'));
        next();
      });
      app.use('/auth', authRoutes);

      const res = await request(app).get('/auth/logout');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Logout failed');
    });
  });
});
