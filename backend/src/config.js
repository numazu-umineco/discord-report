import dotenv from 'dotenv';

dotenv.config();

// Check required environment variables
const requiredEnvVars = [
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_BOT_TOKEN',
  'ALLOWED_GUILD_ID',
  'ALLOWED_ROLE_ID',
  'POST_CHANNEL_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Error: Missing required environment variables:');
  missingEnvVars.forEach(envVar => console.error(`  - ${envVar}`));
  console.error('\nPlease copy .env.example to .env and fill in the values:');
  console.error('  cp .env.example .env');
  process.exit(1);
}

// Parse comma-separated role IDs into an array
function parseRoleIds(roleIdString) {
  if (!roleIdString) return [];
  return roleIdString.split(',').map(id => id.trim()).filter(id => id);
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'discord-report-secret',

  discord: {
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3000/auth/discord/callback',
    botToken: process.env.DISCORD_BOT_TOKEN,
    allowedGuildId: process.env.ALLOWED_GUILD_ID,
    allowedRoleIds: parseRoleIds(process.env.ALLOWED_ROLE_ID),
    postChannelId: process.env.POST_CHANNEL_ID
  }
};
