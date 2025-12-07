# GoatBot-IG-Port

<div align="center">
  <img src="https://i.ibb.co/RQ28H2p/banner.png" alt="GoatBot Instagram Port Banner" width="100%">

  <h3>🤖 Instagram Chat Bot - Official Port of GoatBot V2</h3>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)
  [![Instagram](https://img.shields.io/badge/Platform-Instagram-E4405F?logo=instagram)](https://instagram.com)
</div>

---

## 📖 Introduction

**GoatBot-IG-Port** is the official Instagram port of the popular [GoatBot V2](https://github.com/ntkhang03/Goat-Bot-V2) Messenger bot. This project maintains **100% compatibility** with the original GoatBot command structure while running exclusively on Instagram.

### What's Different?

- **Platform**: Messenger → **Instagram Direct Messages**
- **API**: `fca-unofficial` → **IG-FCA** (Instagram Chat API)
- **Structure**: Identical folder structure and command syntax
- **Commands**: All GoatBot V2 commands work without modification

### IG-FCA API

IG-FCA is a custom-built Instagram messaging API that mimics the `fca-unofficial` interface, providing:
- Session-based authentication
- Message event handling
- Command processing
- Thread and user management
- Admin permissions system

---

## ✨ Features

### Core Functionality
- ✅ **All GoatBot V2 Commands** - Every command ported to Instagram
- ✅ **Session Login** - Secure authentication with session reuse
- ✅ **Event Handlers** - Welcome, leave, rankup, and custom events
- ✅ **Prefix System** - Customizable command prefixes
- ✅ **Admin System** - Multi-level permission control
- ✅ **User Database** - SQLite/JSON data persistence
- ✅ **Auto-Restart** - Automatic recovery from crashes
- ✅ **Command Aliases** - Multiple command names support

### Instagram-Specific Features
- 📱 Works in Instagram DMs (1-on-1 chats)
- 👥 Works in Instagram group chats
- 🔄 Auto-session refresh
- 🛡️ Checkpoint recovery system
- ⚡ Fast message processing

### Limitations
- ❌ No dashboard (Instagram version)
- ❌ Limited to Instagram Graph API capabilities
- ⚠️ Group features depend on Instagram permissions

---

## 🚀 Installation Guide

### Prerequisites
- **Node.js** v16.0.0 or higher
- **Instagram Account** (personal or business)
- **Git** (for cloning)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Gtajisan/GoatBot-IG-Port.git
cd GoatBot-IG-Port
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File
***add cookie arrya using Cookie editor add into account.txt***
npm start 

```

### # Bot Configuration
```
BOT_PREFIX=!
BOT_ADMIN_IDS=instagram_user_id_1,instagram_user_id_2
```

### Step 5: Configure Bot Settings

Edit `config.json`:

```json
{
  "prefix": "!",
  "adminBot": ["your_instagram_user_id"],
  "language": "en",
  "database": {
    "type": "sqlite"
  }
}
```

---

## 📱 Usage Guide

### Starting the Bot

```bash
npm start
```

### Expected Console Output

```
╔══════════════════════════════════════════════╗
║          GoatBot V2 - Multi-Platform         ║
╚══════════════════════════════════════════════╝
🟣 Platform: Instagram (using ig-chat-api)

Starting InstagramGoat.js...

[LOGIN] Connected to Instagram API
[BOT] Bot ID: 17841400000000000
[BOT] Prefix: !
[BOT] Commands loaded: 45
[BOT] Events loaded: 7
[LISTEN] Bot is now listening for Instagram messages
```

### Using Commands

Send a direct message to your Instagram bot account:

```
!help          - Display all commands
!balance       - Check your balance
!daily         - Claim daily reward
!rank          - View your rank card
!admin         - Admin-only commands
```

### Prefix System

- Default prefix: `!`
- Change in `config.json` → `prefix`
- Per-thread prefix: `!prefix <new_prefix>`

### Admin Permissions

Set admin IDs in `config.json`:

```json
{
  "adminBot": [
    "instagram_user_id_here"
  ]
}
```

Admin users can:
- Use restricted commands
- Manage bot settings
- Ban/unban users
- Access bot statistics

---

## 🔐 Login Guide

### Method 1: Instagram Graph API (Recommended)

1. **Create Facebook App**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create new app → Business type
   - Add Instagram product

2. **Get Access Token**
   - Go to Tools → Graph API Explorer
   - Select your app
   - Add permissions: `instagram_basic`, `instagram_manage_messages`
   - Generate token

3. **Get Page ID**
   - Query: `me?fields=instagram_business_account`
   - Copy the `instagram_business_account.id`

4. **Configure Webhook**
   - Set callback URL: `https://your-replit-url.repl.co/webhook`
   - Verify token: Same as `INSTAGRAM_VERIFY_TOKEN` in `.env`
   - Subscribe to: `messages`, `messaging_postbacks`

5. **Add to .account.txt**
   ```account.txt
   your_token
   
   ```

### Method 2: Session File (Legacy)

If you have an existing `session.json`:

1. Place `session.json` in the root directory
2. Bot will automatically load it on startup

### Fixing Instagram Checkpoints

If Instagram asks for verification:

1. Complete the challenge on Instagram app
2. Clear `session.json`
3. Restart bot with credentials
4. New session will be generated

---

## 🌐 Deployment Guide

### Deploy on Replit

1. **Import to Replit**
   - Go to [replit.com/new](https://replit.com/new)
   - Click "Import from GitHub"
   - Paste: `https://github.com/Gtajisan/GoatBot-IG-Port`

2. **Configure Secrets**
   - Click "Secrets" (🔒) in sidebar
   - Add all environment variables from `.env.example`

3. **Configure Run Command**
   - The bot auto-detects and uses `npm start`
   - Or manually set in `.replit` file:
     ```
     run = "npm start"
     ```

4. **Deploy**
   - Click "Run" button
   - For 24/7 hosting, click "Deploy" → Choose deployment tier
   - Set run command: `npm start`
   - Enable auto-scaling if needed

5. **Set Webhook URL**
   - Copy your Replit URL: `https://your-repl-name.your-username.repl.co`
   - Add `/webhook` to the end
   - Update webhook in Facebook Developer Console

### Deploy on VPS/Termux

```bash
# Clone repository
git clone https://github.com/Gtajisan/GoatBot-IG-Port.git
cd GoatBot-IG-Port

# Install dependencies
npm install

# Create .env file
nano .env
# Add your credentials and save (Ctrl+X, Y, Enter)

# Start bot
npm start

# Optional: Use PM2 for process management
npm install -g pm2
pm2 start index.js --name goatbot-ig
pm2 save
pm2 startup
```

### Using PM2 (Optional)

Keep bot running 24/7:

```bash
# Install PM2
npm install -g pm2

# Start bot with PM2
pm2 start index.js --name goatbot-ig

# Auto-restart on reboot
pm2 startup
pm2 save

# View logs
pm2 logs goatbot-ig

# Stop bot
pm2 stop goatbot-ig

# Restart bot
pm2 restart goatbot-ig
```

---

## 📁 Project Structure

```
GoatBot-IG-Port/
├── ig-chat-api/              # Instagram Chat API (FCA-compatible)
│   ├── api/                  # API methods (sendMessage, listen, etc.)
│   ├── utils/                # Helper functions
│   └── index.js              # Main IG-FCA entry point
├── scripts/
│   ├── cmds/                 # All bot commands
│   │   ├── help.js
│   │   ├── balance.js
│   │   ├── daily.js
│   │   └── ...
│   └── events/               # Event handlers
│       ├── welcome.js
│       ├── leave.js
│       └── ...
├── bot/
│   ├── handler/              # Message and event handlers
│   └── login/                # Login and authentication
├── database/
│   ├── controller/           # Database controllers
│   └── models/               # Database models
├── platform/
│   └── ig-wrapper.js         # Instagram platform adapter
├── .env                      # Environment variables (create this)
├── config.json               # Bot configuration
├── configCommands.json       # Command settings
├── index.js                  # Main entry point
├── InstagramGoat.js          # Instagram bot core
└── package.json              # Dependencies
```

---

## 🔧 Troubleshooting

### Bot Not Responding to Commands

**Problem**: Send `!help` but bot doesn't reply

**Solutions**:
1. Check bot is running: `Console should show "LISTEN" message`
2. Verify prefix: Default is `!`, check `config.json`
3. Ensure DM is open: Bot must receive message first
4. Check admin permissions: Some commands are admin-only

### Instagram Session Expired

**Problem**: `Error: Invalid session` or login fails

**Solutions**:
1. Delete `session.json` file
2. Restart bot with fresh credentials
3. Complete any Instagram challenges
4. Use Instagram Graph API method instead

### Module Not Found Error

**Problem**: `Error: Cannot find module 'xyz'`

**Solutions**:
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or install specific module
npm install xyz
```

### Permission Denied Errors

**Problem**: `Error: Permission denied`

**Solutions**:
```bash
# Fix file permissions
chmod +x index.js
chmod -R 755 .

# Or run with appropriate permissions
sudo npm start  # Not recommended on Replit
```

### Port Already in Use

**Problem**: `Error: Port 5000 is already in use`

**Solutions**:
1. Change port in `.env`:
   ```env
   PORT=3000
   ```
2. Or kill existing process:
   ```bash
   # Find process on port 5000
   lsof -i :5000
   # Kill it
   kill -9 <PID>
   ```

### Commands Not Loading

**Problem**: `Commands loaded: 0` in console

**Solutions**:
1. Check `scripts/cmds/` folder exists
2. Ensure `.js` files are present
3. Check file permissions
4. Review console for error messages

### Database Errors

**Problem**: `Error: Database connection failed`

**Solutions**:
1. Delete `database/data/*.json` files
2. Restart bot to regenerate database
3. Switch database type in `config.json`:
   ```json
   {
     "database": {
       "type": "sqlite"  // or "json"
     }
   }
   ```

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Test commands before submitting
- Update documentation for new features
- Keep commits atomic and descriptive

---

## 📜 Credits

### Original GoatBot V2
- **Author**: [NTKhang (NTKhang03)](https://github.com/ntkhang03)
- **Repository**: [GoatBot-V2](https://github.com/ntkhang03/GoatBot-V2)
- **License**: MIT

### Instagram Port
- **Ported by**: [Gtajisan](https://github.com/Gtajisan)
- **IG-FCA API**: Custom Instagram Chat API adapter
- **Repository**: [GoatBot-IG-Port](https://github.com/Gtajisan/GoatBot-IG-Port)

### Special Thanks
- GoatBot V2 community
- Instagram Graph API documentation
- All contributors and testers

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

### License Terms

- ✅ Free to use, modify, and distribute
- ✅ Can be used commercially
- ✅ Must include original copyright notice
- ❌ Cannot claim as original work
- ❌ Cannot remove author credits

---

## 📞 Support

### Get Help
- **Issues**: [GitHub Issues](https://github.com/Gtajisan/GoatBot-IG-Port/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Gtajisan/GoatBot-IG-Port/discussions)
- **Email**: Support via GitHub only

### Useful Links
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Original GoatBot V2](https://github.com/ntkhang03/GoatBot-V2)
- [Node.js Documentation](https://nodejs.org/docs)

---

## ⚠️ Disclaimer

- This bot uses unofficial Instagram methods
- Use at your own risk
- Author not responsible for account bans
- Recommended to use test/secondary accounts
- Follow Instagram's Terms of Service
- Do not spam or violate community guidelines

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/Gtajisan">Gtajisan</a></p>
  <p>Based on <a href="https://github.com/ntkhang03/Goat-Bot-V2">GoatBot V2</a> by <a href="https://github.com/ntkhang03">NTKhang</a></p>

  ⭐ **Star this repo if you find it useful!** ⭐
</div>
