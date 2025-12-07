
# 🐐 GoatBot Instagram Port V2

A fully-featured Instagram bot based on GoatBot V2 architecture with FCA-style API integration.

## Features

- ✅ Cookie-based authentication system
- ✅ Multiple account support
- ✅ Command handler with cooldowns and permissions
- ✅ Event system for message handling
- ✅ Web dashboard on port 5000
- ✅ Modular command structure
- ✅ Auto-reconnect and error handling
- ✅ Admin management system

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Accounts**
   
   Edit `account.txt` with your Instagram account credentials:
   ```json
   [
     {
       "username": "your_username",
       "password": "your_password"
     }
   ]
   ```
   
   Or use cookies (recommended):
   ```json
   [
     {
       "cookies": { /* cookie jar from previous login */ }
     }
   ]
   ```

3. **Configure Bot**
   
   Edit `config.json`:
   - Set your preferred `prefix`
   - Add admin user IDs to `adminUIDs`
   - Configure dashboard settings

4. **Run the Bot**
   ```bash
   npm start
   ```

## Commands

- `!help` - Show all commands
- `!ping` - Check bot response time
- `!admin` - Manage administrators (admin only)

## Creating Custom Commands

Create a new file in the `commands/` directory:

```javascript
module.exports = {
    config: {
        name: 'mycommand',
        aliases: ['mc'],
        description: 'My custom command',
        usage: '[args]',
        cooldown: 5,
        role: 0 // 0 = everyone, 1+ = admin
    },
    
    async run({ api, message, args, config }) {
        await api.sendMessage(message.threadID, 'Hello from custom command!');
    }
};
```

## Dashboard

Access the web dashboard at: `http://localhost:5000`

## Architecture

- `index.js` - Main entry point
- `core/login.js` - Instagram authentication with FCA-style API
- `core/handler.js` - Command and event handler
- `core/dashboard.js` - Web dashboard
- `commands/` - Bot commands
- `events/` - Event handlers
- `utils/logger.js` - Logging utility

## Migration from Messenger GoatBot V2

This port maintains the same structure and behavior as GoatBot V2 but adapted for Instagram:

- FCA-style API wrapper around Instagram Private API
- Same command structure and handler logic
- Cookie-based authentication similar to FB appstate
- Dashboard and admin features preserved

## Notes

- Instagram has rate limits - the bot polls every 3 seconds
- Some Messenger features (reactions, typing indicators) have limited support
- Cookie sessions are saved and reused for faster reconnection

## License

MIT
