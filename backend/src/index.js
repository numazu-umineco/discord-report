import { config } from './config.js';
import { createApp } from './app.js';
import { startDiscordBot } from './discord.js';

async function startServer() {
  try {
    await startDiscordBot();

    const app = createApp();
    app.listen(config.port, () => {
      console.log(`Server is running on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
