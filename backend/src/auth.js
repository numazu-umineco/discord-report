import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord-auth';
import { config } from './config.js';
import { getGuildMemberByBot } from './discord.js';

// Configure passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Discord OAuth2 Strategy
passport.use(new DiscordStrategy({
  clientId: config.discord.clientId,
  clientSecret: config.discord.clientSecret,
  callbackUrl: config.discord.callbackUrl,
  scope: ['identify', 'guilds']
}, (accessToken, refreshToken, profile, done) => {
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

// Check if user has access (is in allowed guild and has allowed role)
export async function checkUserAccess(user) {
  const userGuilds = user.guilds || [];
  const isInGuild = userGuilds.some(guild => guild.id === config.discord.allowedGuildId);

  if (!isInGuild) {
    return { authorized: false, error: 'NOT_IN_GUILD' };
  }

  const member = await getGuildMemberByBot(config.discord.allowedGuildId, user.id);
  if (!member) {
    return { authorized: false, error: 'MEMBER_FETCH_FAILED' };
  }

  const hasRole = config.discord.allowedRoleIds.some(roleId => member.roles.includes(roleId));
  if (!hasRole) {
    return { authorized: false, error: 'NO_REQUIRED_ROLE' };
  }

  return { authorized: true, member };
}

const AUTH_CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

// Check authorization with session cache
export async function checkUserAccessWithCache(req) {
  // Use cached authorization if available and not expired
  if (req.session.authCache &&
      Date.now() - req.session.authCache.timestamp < AUTH_CACHE_EXPIRY) {
    return req.session.authCache;
  }

  const access = await checkUserAccess(req.user);

  // Cache the result
  req.session.authCache = {
    authorized: access.authorized,
    error: access.error || null,
    member: access.member || null,
    timestamp: Date.now()
  };

  return req.session.authCache;
}

// Middleware to check authorization
export async function requireAuthorization(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
  }

  const cached = await checkUserAccessWithCache(req);
  if (!cached.authorized) {
    return res.status(403).json({ error: 'Access denied', code: cached.error });
  }

  req.memberInfo = cached.member;
  next();
}

export { passport };
