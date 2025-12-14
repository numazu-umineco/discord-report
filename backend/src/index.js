import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord-auth';
import dotenv from 'dotenv';

dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_BOT_TOKEN',
  'ALLOWED_GUILD_ID',
  'ALLOWED_ROLE_ID'
];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\nPlease copy .env.example to .env and fill in the values:');
  console.error('  cp .env.example .env');
  process.exit(1);
}

const ALLOWED_GUILD_ID = process.env.ALLOWED_GUILD_ID;
const ALLOWED_ROLE_ID = process.env.ALLOWED_ROLE_ID;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'discord-report-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Discord OAuth2 Strategy
passport.use(new DiscordStrategy({
  clientId: process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
  scope: ['identify', 'guilds', 'guilds.members.read']
}, (accessToken, refreshToken, profile, done) => {
  // Store tokens with user profile for later API calls
  const user = {
    id: profile.id,
    username: profile.username,
    discriminator: profile.discriminator,
    avatar: profile.avatar,
    guilds: profile.guilds,
    accessToken,
    refreshToken
  };
  return done(null, user);
}));

// Fetch user's member info for a specific guild
async function getGuildMember(guildId, accessToken) {
  const response = await fetch(`https://discord.com/api/v10/users/@me/guilds/${guildId}/member`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
}

// Check if user has access (is in allowed guild and has allowed role)
async function checkUserAccess(user) {
  // Check if user is in the allowed guild
  const userGuilds = user.guilds || [];
  const isInGuild = userGuilds.some(guild => guild.id === ALLOWED_GUILD_ID);

  if (!isInGuild) {
    return { authorized: false, error: 'NOT_IN_GUILD' };
  }

  // Check if user has the required role
  const member = await getGuildMember(ALLOWED_GUILD_ID, user.accessToken);
  if (!member) {
    return { authorized: false, error: 'MEMBER_FETCH_FAILED' };
  }

  const hasRole = member.roles.includes(ALLOWED_ROLE_ID);
  if (!hasRole) {
    return { authorized: false, error: 'NO_REQUIRED_ROLE' };
  }

  return { authorized: true, member };
}

// Middleware to check authorization
async function requireAuthorization(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
  }

  const access = await checkUserAccess(req.user);
  if (!access.authorized) {
    return res.status(403).json({ error: 'Access denied', code: access.error });
  }

  req.memberInfo = access.member;
  next();
}

// Routes
app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/auth/failed' }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/auth/callback`);
  }
);

app.get('/auth/failed', (req, res) => {
  res.status(401).json({ error: 'Authentication failed' });
});

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Check user authentication and authorization status
app.get('/api/auth/status', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.json({ authenticated: false });
  }

  const { accessToken, refreshToken, ...safeUser } = req.user;
  const access = await checkUserAccess(req.user);

  res.json({
    authenticated: true,
    authorized: access.authorized,
    error: access.error || null,
    user: safeUser
  });
});

app.get('/api/user', requireAuthorization, (req, res) => {
  const { accessToken, refreshToken, ...safeUser } = req.user;
  res.json(safeUser);
});

// Fetch guilds where the bot is installed
async function getBotGuilds() {
  const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch bot guilds');
  }
  return response.json();
}

app.get('/api/guilds', requireAuthorization, async (req, res) => {
  try {
    // Get guilds where the bot is installed
    const botGuilds = await getBotGuilds();
    const botGuildIds = new Set(botGuilds.map(g => g.id));

    // Only return the allowed guild if bot is installed there
    if (botGuildIds.has(ALLOWED_GUILD_ID)) {
      const allowedGuild = req.user.guilds.find(g => g.id === ALLOWED_GUILD_ID);
      res.json(allowedGuild ? [allowedGuild] : []);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({ error: 'Failed to fetch guilds' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
