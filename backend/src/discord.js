import { config } from './config.js';

const DISCORD_API_BASE = 'https://discord.com/api/v10';

// Fetch guild member info using Bot token
export async function getGuildMemberByBot(guildId, userId) {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
    headers: {
      Authorization: `Bot ${config.discord.botToken}`
    }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('Failed to fetch guild member:', response.status, error);
    return null;
  }
  return response.json();
}

// Fetch guilds where the bot is installed
export async function getBotGuilds() {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bot ${config.discord.botToken}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch bot guilds');
  }
  return response.json();
}

// Post embed message to Discord channel
export async function postEmbedToDiscord(content, embed) {
  const response = await fetch(`${DISCORD_API_BASE}/channels/${config.discord.postChannelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${config.discord.botToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content, embeds: [embed] })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to post message');
  }

  return response.json();
}

// Get user avatar URL
export function getUserAvatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
}
