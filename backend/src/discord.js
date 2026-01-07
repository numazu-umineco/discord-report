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
export async function postEmbedToDiscord(content, embed, imageFile = null) {
  const url = `${DISCORD_API_BASE}/channels/${config.discord.postChannelId}/messages`;

  if (imageFile) {
    // multipart/form-data for image attachment
    const formData = new FormData();

    const payload = {
      content,
      embeds: [embed],
      attachments: [{
        id: 0,
        filename: imageFile.filename,
        description: '活動報告画像'
      }]
    };
    formData.append('payload_json', JSON.stringify(payload));

    const blob = new Blob([imageFile.buffer], { type: imageFile.contentType });
    formData.append('files[0]', blob, imageFile.filename);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${config.discord.botToken}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to post message with image');
    }

    return response.json();
  } else {
    // JSON for text-only message
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${config.discord.botToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, embeds: [embed] })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to post message');
    }

    return response.json();
  }
}

// Get user avatar URL
export function getUserAvatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
}
