import { Client, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { config } from './config.js';

// Discord.js client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let isReady = false;

// Initialize and login the bot
export async function startDiscordBot() {
  return new Promise((resolve, reject) => {
    client.once('ready', () => {
      console.log(`Discord Bot is online as ${client.user.tag}`);
      isReady = true;
      resolve();
    });

    client.on('error', (error) => {
      console.error('Discord client error:', error);
    });

    client.login(config.discord.botToken).catch(reject);
  });
}

// Fetch guild member info
export async function getGuildMemberByBot(guildId, userId) {
  try {
    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(userId);
    return {
      user: {
        id: member.user.id,
        username: member.user.username,
        avatar: member.user.avatar,
        discriminator: member.user.discriminator,
        global_name: member.user.globalName
      },
      nick: member.nickname,
      roles: member.roles.cache.map(role => role.id)
    };
  } catch (error) {
    console.error('Failed to fetch guild member:', error.message);
    return null;
  }
}

// Fetch guilds where the bot is installed
export async function getBotGuilds() {
  const guilds = await client.guilds.fetch();
  return guilds.map(guild => ({
    id: guild.id,
    name: guild.name
  }));
}

// Post embed message to Discord channel
export async function postEmbedToDiscord(content, embed, imageFile = null) {
  const channel = await client.channels.fetch(config.discord.postChannelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error('Invalid channel or channel is not text-based');
  }

  const discordEmbed = new EmbedBuilder(embed);
  const messageOptions = {
    content,
    embeds: [discordEmbed]
  };

  if (imageFile) {
    const attachment = new AttachmentBuilder(imageFile.buffer, {
      name: imageFile.filename,
      description: '活動報告画像'
    });
    messageOptions.files = [attachment];
    // Update embed to reference the attachment
    discordEmbed.setImage(`attachment://${imageFile.filename}`);
  }

  const message = await channel.send(messageOptions);
  return {
    id: message.id,
    channel_id: message.channelId
  };
}

// Get user avatar URL
export function getUserAvatarUrl(user) {
  if (user.avatar) {
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
  }
  return `https://cdn.discordapp.com/embed/avatars/${parseInt(user.id) % 5}.png`;
}

// Get the discord.js client instance
export function getClient() {
  return client;
}

// Check if bot is ready
export function isBotReady() {
  return isReady;
}
