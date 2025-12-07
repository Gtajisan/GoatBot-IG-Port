
# 🤖 Instagram GoatBot

A powerful Instagram bot based on GoatBot-V2 architecture with automatic command loading, event handling, and session management.

## ✨ Features

- 🔄 **Auto Command Loading** - Automatically loads all commands from `/commands` folder
- 🔐 **Session Management** - Automatic login with session persistence
- 👮 **Permission System** - Role-based command access (Everyone/Group Admin/Bot Admin)
- ⏱️ **Cooldown System** - Prevent command spam
- 📝 **Event Normalizer** - Consistent event format across all commands
- 🎨 **Rich Media Support** - Handle images, videos, voice messages
- 🌐 **Health Check Server** - Built-in Express server for monitoring
- 📊 **Detailed Logging** - Color-coded console logs with timestamps

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
IG_USERNAME=your_instagram_username
IG_PASSWORD=your_instagram_password
BOT_PREFIX=/
ADMIN_IDS=["your_user_id"]
```

### 3. Run the Bot

```bash
npm start
```

## 📁 Project Structure

```
instagram-goatbot/
├── commands/          # Bot commands
│   ├── help.js
│   ├── ping.js
│   ├── info.js
│   └── ...
├── core/             # Core bot systems
│   ├── CommandHandler.js
│   ├── EventNormalizer.js
│   ├── SessionManager.js
│   └── PermissionManager.js
├── server/           # Web server
│   └── index.js
├── utils/            # Utilities
│   └── Logger.js
├── index.js          # Main entry point
├── .env              # Configuration
└── package.json
```

## 🛠️ Creating Commands

Create a new file in `/commands/yourcommand.js`:

```javascript
export default {
  config: {
    name: 'yourcommand',
    aliases: ['yc', 'cmd'],
    description: 'Command description',
    usage: '[arguments]',
    cooldown: 5,
    role: 0  // 0: Everyone, 1: Group Admin, 2: Bot Admin
  },

  async run({ api, event, args, bot }) {
    // Your command logic here
    return api.sendMessage('Hello from your command!');
  }
};
```

### Available API Methods

- `api.sendMessage(message, options)` - Send a message
- `api.react(messageId, emoji)` - React to a message
- `api.getUserInfo(userId)` - Get user information

### Event Object

```javascript
{
  type: 'message',
  threadID: 'thread_id',
  messageID: 'message_id',
  senderID: 'sender_id',
  body: 'message text',
  isGroup: true/false,
  mentions: [...],
  attachments: [...],
  timestamp: 1234567890
}
```

## 📋 Built-in Commands

| Command | Aliases | Description | Role |
|---------|---------|-------------|------|
| `/help` | h, commands | Show all commands | Everyone |
| `/ping` | latency | Check response time | Everyone |
| `/info` | botinfo, about | Bot information | Everyone |
| `/uptime` | runtime | Show bot uptime | Everyone |
| `/say` | echo | Make bot say something | Everyone |
| `/userinfo` | user, profile | Get user info | Everyone |
| `/admin` | botadmin | Admin verification | Bot Admin |
| `/restart` | reboot | Restart the bot | Bot Admin |

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `IG_USERNAME` | Instagram username | Required |
| `IG_PASSWORD` | Instagram password | Required |
| `BOT_PREFIX` | Command prefix | `/` |
| `ADMIN_IDS` | Bot admin user IDs (JSON array) | `[]` |
| `THREAD_WHITELIST` | Allowed threads (JSON array) | `[]` |
| `THREAD_BLACKLIST` | Blocked threads (JSON array) | `[]` |
| `AUTO_SAVE_SESSION` | Auto-save login session | `true` |
| `DEBUG_MODE` | Enable debug logs | `false` |
| `PORT` | Web server port | `5000` |

## 🔒 Permissions

The bot has a 3-tier permission system:

- **Role 0 (Everyone)**: All users can use the command
- **Role 1 (Group Admin)**: Only group admins (feature limited in IG API)
- **Role 2 (Bot Admin)**: Only users in `ADMIN_IDS` env variable

## 🌐 Web Endpoints

- `GET /` - Bot status and statistics
- `GET /health` - Health check endpoint

## 📝 Logging

The bot uses color-coded logging:

- 🔵 **Info** - General information
- ✅ **Success** - Successful operations
- ⚠️ **Warning** - Non-critical issues
- ❌ **Error** - Error messages
- 🐛 **Debug** - Debug logs (when `DEBUG_MODE=true`)
- ⚡ **Command** - Command executions

## 🚨 Error Handling

- Automatic retry on network failures
- Graceful handling of API errors
- Session recovery on expiration
- Command error isolation

## 📱 Instagram API Limitations

Instagram's private API has some limitations:

- No real-time webhook support (uses polling)
- Rate limiting on API calls
- Limited group admin detection
- Possible account restrictions if overused

**Recommendation**: Use a dedicated account for the bot.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🆘 Support

For issues or questions, please create an issue in the repository.

## ⚠️ Disclaimer

This bot uses Instagram's private API which is not officially supported. Use at your own risk. The developers are not responsible for any account restrictions or bans.
