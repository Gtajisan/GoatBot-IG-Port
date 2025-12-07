
import express from 'express';
import { Logger } from '../utils/Logger.js';

export function setupWebServer(bot) {
  const app = express();
  const port = process.env.PORT || 5000;

  app.get('/', (req, res) => {
    res.json({
      status: 'running',
      bot: 'Instagram GoatBot',
      uptime: process.uptime(),
      commands: bot.commandHandler.commands.size,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/health', (req, res) => {
    res.json({
      healthy: bot.isRunning,
      timestamp: new Date().toISOString()
    });
  });

  app.listen(port, '0.0.0.0', () => {
    Logger.success(`🌐 Web server running on port ${port}`);
  });

  return app;
}
