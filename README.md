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
   Rename `.env.example` to `.env` and fill in your details:
   ```
   IG_USERNAME=your_instagram_username
   IG_PASSWORD=your_instagram_password
   ```
   *Alternatively, you can use `account.txt` with `username=...` and `password=...`.*

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

## 🔒 Whitelist & Approval Logic

The bot includes several modes to control who can interact with it:

1. **Admin Only Mode**:
   Set `"adminOnly": { "enable": true }` in `config.json`. Only IDs in `adminBot` can use the bot.

2. **User Whitelist**:
   Enable `whiteListMode` and add user IDs to `whiteListIds`. Only these users can use the bot in DMs or groups.

3. **Thread Whitelist**:
   Enable `whiteListModeThread` and add thread IDs (Group IDs or DM IDs) to `whiteListThreadIds`. The bot will only respond within these specific threads.

4. **Combined Mode**:
   If both whitelists are enabled, the bot responds if *either* the user is whitelisted *or* the thread is whitelisted.

5. **Group Admin Approval (OnlyAdminBox)**:
   In group settings, you can enable `onlyAdminBox`. When on, only group admins can trigger bot commands.

---

## 🛡️ Safe Login & Session Continuity

To prevent your account from being flagged as a "new login" every time the bot restarts, we use a sophisticated session persistence mechanism:

- **Stable Fingerprints**: The bot generates unique, stable device identifiers (`deviceID`, `uuid`, `androidID`) based on your username.
- **Session Reuse**: These identifiers, along with your cookies, are saved in `session.json`.
- **continuity**: On subsequent starts, the bot restores the exact same "device" and session, mimicking a real app that stays logged in.

## ⚙️ Configuration (config.json)

| Key | Description |
|-----|-------------|
| `whiteListMode` | Enable whitelisting specific users by ID. |
| `whiteListModeThread` | Enable whitelisting specific threads (Groups/DMs) by ID. |
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
2. **Whitelist Mode**: Use `whiteListMode` or `whiteListModeThread` to restrict the bot to approved users or groups. This is highly recommended to prevent random users from triggering the bot and causing rate limits.
3. **Warm Up**: Before running the bot, log into the account on the same IP via a browser.
4. **Avoid Spam**: Don't use the bot to send mass messages or join too many groups quickly.
5. **Dedicated Account**: Use a secondary account to avoid risking your personal profile.

---

## ❓ Troubleshooting

- **"Checkpoint Required"**: Approve the login on your phone or use `IG_CHECKPOINT_CODE`.
- **"Rate Limited"**: The bot will automatically back off and retry. If persistent, increase polling delays.
- **"Invalid Credentials"**: Double-check `account.txt` or your Replit Secrets.

---

## Credits
Based on NTKhang's GoatBot V2 and powered by the community.

> **Disclaimer**: Use at your own risk. This project is not affiliated with Instagram/Meta.
