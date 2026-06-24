# GoatBot V2 — Instagram Port

A fully-featured Instagram DM bot powered by GoatBot V2's plug-and-play command/event system.  
Built by **Gtajisan**, based on [NTKhang's GoatBot V2](https://github.com/ntkhang03/Goat-Bot-V2).

---

## 🚀 Features

- **Private API**: Uses a specialized Instagram Chat API that emulates the mobile app.
- **Robust Logging**: New `winston`-based logging system with level support, daily rotation, and structured JSON logs.
- **Anti-Ban Measures**: Natural `humanDelay` before replies, typing indicators, and automatic backoff on rate limits.
- **AI Fallback**: Automatically trigger an AI command when no specific command matches a user's message.
- **Session Persistence**: Saves login state to `session.json` to prevent frequent logins.
- **Plug-and-play**: Commands and events load automatically from the `scripts/` folder.
- **Database Support**: Built-in support for JSON, SQLite, and MongoDB.

---

## 📋 Requirements

- **Node.js**: 20.x or higher
- **npm**: 7.0.0+
- **Instagram Account**: A real account (avoid brand-new accounts to reduce ban risk).

---

## 🛠️ Quick Setup & Deployment

### Option 1: Local / VPS (Recommended)

1. **Clone and Install**:
   ```bash
   git clone https://github.com/Gtajisan/GoatBot-IG-Port.git
   cd GoatBot-IG-Port
   npm install
   ```

2. **Set Credentials**:
   Open `account.txt` and add your username and password:
   ```
   username=your_instagram_username
   password=your_instagram_password
   ```

3. **Configure**:
   Edit `config.json` to set your admin ID and preferred prefix:
   ```json
   {
     "adminBot": [123456789],
     "prefix": "/",
     "language": "en"
   }
   ```

4. **Start**:
   ```bash
   npm start
   ```

### Option 2: Replit

1. **Secrets**: Add `IG_USERNAME` and `IG_PASSWORD` to your Replit Secrets.
2. **Run**: Click the "Run" button. The bot will automatically use the secrets for login.

---

## ⚙️ Configuration (config.json)

| Key | Description |
|-----|-------------|
| `humanDelay` | Configures random delays and typing indicators before replies. |
| `logging` | Sets `logLevel` (info, debug, etc.) and enables/disables `logToFile`. |
| `aiFallback` | Enables triggering an AI command (e.g., `gpt`) if no command is matched. |
| `optionsFca` | Advanced Instagram API options like `autoMarkRead` and `listenEvents`. |

---

## 📂 Project Structure

- `scripts/cmds/`: Place your command `.js` files here.
- `scripts/events/`: Place your event handler `.js` files here.
- `logger/`: The new robust logging implementation.
- `logs/`: (Auto-generated) Contains daily rotation logs.
- `utils.js`: Core utility functions, including `humanDelay` and `withBackoff`.

---

## 🤝 Best Practices & Anti-Ban

1. **Use Natural Delays**: Keep `humanDelay` enabled in `config.json` to make the bot appear more human.
2. **Warm Up**: Before running the bot, log into the account on the same IP via a browser.
3. **Avoid Spam**: Don't use the bot to send mass messages or join too many groups quickly.
4. **Dedicated Account**: Use a secondary account to avoid risking your personal profile.

---

## ❓ Troubleshooting

- **"Checkpoint Required"**: Approve the login on your phone or use `IG_CHECKPOINT_CODE`.
- **"Rate Limited"**: The bot will automatically back off and retry. If persistent, increase polling delays.
- **"Invalid Credentials"**: Double-check `account.txt` or your Replit Secrets.

---

## Credits
Based on NTKhang's GoatBot V2 and powered by the community.

> **Disclaimer**: Use at your own risk. This project is not affiliated with Instagram/Meta.
