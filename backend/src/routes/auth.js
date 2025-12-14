import { Router } from 'express';
import { passport, checkUserAccessWithCache } from '../auth.js';
import { config } from '../config.js';

const router = Router();

// Check user authentication and authorization status
router.get('/status', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.json({ authenticated: false });
  }

  const { accessToken, refreshToken, guilds, ...safeUser } = req.user;
  const cached = await checkUserAccessWithCache(req);

  res.json({
    authenticated: true,
    authorized: cached.authorized,
    error: cached.error,
    user: safeUser
  });
});

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/auth/failed' }),
  (req, res) => {
    res.redirect(`${config.frontendUrl}/auth/callback`);
  }
);

router.get('/failed', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

export default router;
