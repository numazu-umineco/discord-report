import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord-auth';
import { config } from './config.js';
import { getGuildMember } from './discord.js';

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
  scope: ['identify', 'guilds', 'guilds.members.read']
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

  const member = await getGuildMember(config.discord.allowedGuildId, user.accessToken);
  if (!member) {
    return { authorized: false, error: 'MEMBER_FETCH_FAILED' };
  }

  const hasRole = member.roles.includes(config.discord.allowedRoleId);
  if (!hasRole) {
    return { authorized: false, error: 'NO_REQUIRED_ROLE' };
  }

  return { authorized: true, member };
}

// Middleware to check authorization
export async function requireAuthorization(req, res, next) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated', code: 'NOT_AUTHENTICATED' });
  }

  // Use cached authorization if available and not expired (cache for 5 minutes)
  const cacheExpiry = 5 * 60 * 1000;
  if (req.session.authCache &&
      req.session.authCache.authorized &&
      Date.now() - req.session.authCache.timestamp < cacheExpiry) {
    req.memberInfo = req.session.authCache.member;
    return next();
  }

  const access = await checkUserAccess(req.user);
  if (!access.authorized) {
    // Clear cache on authorization failure
    req.session.authCache = null;
    return res.status(403).json({ error: 'Access denied', code: access.error });
  }

  // Cache the authorization result
  req.session.authCache = {
    authorized: true,
    member: access.member,
    timestamp: Date.now()
  };

  req.memberInfo = access.member;
  next();
}

export { passport };
