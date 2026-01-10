import express from 'express';
import cors from 'cors';
import session from 'express-session';
import morgan from 'morgan';
import { config } from './config.js';
import { passport } from './auth.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

export function createApp() {
  const app = express();

  // Trust proxy (Cloudflare, nginx, etc.)
  // Enables correct req.protocol, req.secure, req.ip from X-Forwarded-* headers
  app.set('trust proxy', true);

  // Request logging
  app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

  // Cache-Control headers for CDN (Cloudflare)
  app.use((_req, res, next) => {
    // API and auth routes should not be cached
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
  });

  // Middleware
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true
  }));
  app.use(express.json());
  app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.nodeEnv === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
