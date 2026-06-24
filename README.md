# GoatBot V2 — Instagram Port

A fully-featured Instagram DM bot powered by GoatBot V2's plug-and-play command/event system.  
Built by **Gtajisan**, based on [NTKhang's GoatBot V2](https://github.com/ntkhang03/Goat-Bot-V2).

---

## Features

- Responds to Instagram Direct Messages & Group Chats
- **Email/Password login** — no more expired cookie headaches
- **Robust Logging** — New `winston`-based logging system with level support and daily rotation
- **Anti-Ban Measures** — Natural `humanDelay` before replies and automatic rate-limit backoff
- Auto session restore — re-login only when truly needed
- Plug-and-play commands & events (drop a `.js` file, it loads automatically)
- JSON / SQLite / MongoDB database support
- Optional web dashboard
- Built-in AI, economy, moderation, and more

---

## Requirements

| Tool | Minimum Version |
|------|----------------|
| Node.js | 20.x |
| npm | 7.0.0+ |
| Instagram Account | Real account (avoid brand-new accounts) |

---

## Quick Setup — Replit

### Step 1 — Add your credentials as Secrets

In your Replit project open the **Secrets** panel (lock icon in the sidebar) and add:

| Key | Value |
|-----|-------|
| `IG_USERNAME` | Your Instagram username (no `@`) |
| `IG_PASSWORD` | Your Instagram password |

> **Why Secrets?** They are encrypted and never stored in your code.  
> `account.txt` also works (see below) but Secrets are safer for cloud deployments.

### Step 2 — Run

Click the **Run** button or start the `GoatBot Instagram` workflow.  
The bot will log in, load all commands, and start listening for messages.

---

## Quick Setup — Local / VPS

### Step 1 — Clone and install

```bash
git clone https://github.com/your-repo/GoatBot-IG-Port.git
cd GoatBot-IG-Port
npm install
```

### Step 2 — Set credentials

Open **`account.txt`** and fill in your details:

```
username=your_instagram_username
password=your_instagram_password
```

> Do **not** include the `@` symbol.

### Step 3 — Configure the bot

Edit **`config.json`**:

```json
{
  "adminBot": [YOUR_INSTAGRAM_USER_ID],
  "prefix": "/",
  "language": "en",
  "database": { "type": "json" }
}
```

To find your Instagram numeric user ID, search *"Instagram user ID finder"* online and enter your username.

### New Features & Best Practices

This port has been enhanced with patterns to ensure reliability and realism:

#### 1. Enhanced Logging
- **Location**: `./logs/`
- **Features**: Console colors, daily rotation (`application-YYYY-MM-DD.log`, `error-YYYY-MM-DD.log`), and structured metadata.
- **Usage**: `global.utils.log.info("TAG", "Message")`

#### 2. Natural Delays & Realism
- **Human Delay**: Configurable random delays before the bot replies.
- **Typing Indicators**: Bot will show "typing..." before sending a message.
- **Read Receipts**: Automatically marks messages as read if enabled.

#### 3. Error Handling
- **Backoff Logic**: Automatically waits and retries when hitting Instagram rate limits.
- **Comprehensive try/catch**: Better error reporting and stability.

### Step 4 — Start

```bash
node index.js
```

---

## Login Methods — Priority Order

The bot tries each method in sequence and uses the first one that succeeds:

```
1. IG_USERNAME + IG_PASSWORD  environment variables  (Replit Secrets / system env)
2. username + password        in account.txt
3. Saved session              session.json           (auto-restored from last login)
4. Cookie array               account.txt legacy     (expires often — not recommended)
```

### Option A — Environment Variables (best for Replit / cloud)

```bash
export IG_USERNAME=your_username
export IG_PASSWORD=your_password
```

### Option B — account.txt (best for local / VPS)

```
username=your_instagram_username
password=your_instagram_password
```

### Option C — JSON format in account.txt

```json
{"username": "your_username", "password": "your_password"}
```

---

## Two-Factor Authentication (2FA)

### Interactive mode (local terminal)

The bot prompts you to type the 2FA code directly in the terminal.

### Non-interactive mode (Replit / cloud / no TTY)

Set the `IG_2FA_CODE` environment variable **before** starting the bot:

```
IG_2FA_CODE=123456
```

> **Tip:** Temporarily disable 2FA while setting up for the first time.  
> After the first successful login, `session.json` is saved and reused automatically — 2FA won't be triggered again until the session expires.

---

## Login Challenge / Checkpoint

Instagram sometimes requires account verification when it detects a new IP or device.

**What to do:**

1. Open the Instagram app on your **phone** and approve the suspicious login notification, then restart the bot.
2. Or check your **email/SMS** for a verification code, then set:
   ```
   IG_CHECKPOINT_CODE=123456
   ```
   …and restart the bot.

> **Pro tip:** Log into `instagram.com` in a browser from the **same IP** as the bot server before running the bot. This warms up the IP and reduces checkpoint triggers.

---

## Project Structure

```
GoatBot-IG-Port/
├── index.js                      ← Entry point
├── InstagramGoat.js               ← Bot bootstrap & global setup
├── account.txt                    ← Your credentials (gitignored)
├── config.json                    ← Bot configuration
├── configCommands.json            ← Per-command settings
├── session.json                   ← Auto-saved session (gitignored, do not edit)
│
├── ig-chat-api/                   ← Instagram API layer (FCA-compatible)
│   ├── index.js                   ← Login entrypoint (password + cookie)
│   └── src/
│       ├── auth/
│       │   └── passwordLogin.js   ← Email/password via Instagram mobile API
│       ├── sendMessage.js
│       ├── listenMqtt.js          ← Polling-based message listener
│       ├── getUserInfo.js
│       ├── getThreadInfo.js
│       └── ...
│
├── bot/
│   ├── login/
│   │   ├── loginIG.js             ← Main login flow (all methods)
│   │   ├── loadData.js            ← Database initialisation
│   │   └── loadScripts.js         ← Command/event loader
│   └── handler/
│       └── handlerAction.js       ← Message/event dispatcher
│
├── scripts/
│   ├── cmds/                      ← Bot commands  (1 file = 1 command)
│   └── events/                    ← Bot event handlers
│
├── dashboard/app.js               ← Web dashboard (Express)
└── database/                      ← JSON / SQLite / MongoDB controllers
```

---

## config.json Reference

```jsonc
{
  // Numeric Instagram user ID(s) with bot admin rights
  "adminBot": [123456789],

  // Command prefix
  "prefix": "/",

  // Bot language: "en" or "vi"
  "language": "en",

  // Database backend
  "database": {
    "type": "json",          // "json" | "sqlite" | "mongodb"
    "uriMongodb": ""         // MongoDB URI — only needed when type = "mongodb"
  },

  // Web dashboard
  "dashBoard": {
    "enable": true,
    "port": 3000
  },

  // Instagram API options
  "optionsFca": {
    "listenEvents": true,
    "selfListen": false,
    "autoMarkDelivery": false,
    "autoMarkRead": false,
    "autoReconnect": true
  },

  // Polling delays in ms (increase if you get rate-limited)
  "instagramPolling": {
    "minDelay": 5000,
    "maxDelay": 120000
  }
}
```

---

## Adding a Command

Create a file in `scripts/cmds/yourcommand.js`:

```js
module.exports = {
  config: {
    name: "hello",
    version: "1.0",
    author: "You",
    countDown: 5,       // cooldown in seconds
    role: 0,            // 0 = everyone, 1 = group admin, 2 = bot admin
    shortDescription: "Says hello",
    longDescription: "Greets the user",
    category: "fun",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, args }) {
    await api.sendMessage("Hello!", event.threadID, event.messageID);
  }
};
```

The bot picks it up automatically on next start (or immediately if `autoLoadScripts.enable` is `true`).

---

## Adding an Event

Create a file in `scripts/events/myevent.js`:

```js
module.exports = {
  config: {
    name: "myEvent",
    eventType: ["message"],
    version: "1.0",
    author: "You",
    description: "Handles incoming messages"
  },

  onStart: async function ({ api, event }) {
    // runs on every matching message event
  }
};
```

---

## Database Options

### JSON (default — no setup)

```json
{ "database": { "type": "json" } }
```

Data saved in `database/data/` as plain JSON files. Great for development.

### SQLite (local file, no external service)

```json
{ "database": { "type": "sqlite" } }
```

Data saved in `database/data/database.db`.

### MongoDB (recommended for production)

```json
{
  "database": {
    "type": "mongodb",
    "uriMongodb": "mongodb+srv://user:pass@cluster.mongodb.net/goatbot"
  }
}
```

Get a free hosted database at [MongoDB Atlas](https://www.mongodb.com/atlas).

---

## Troubleshooting

### "All login methods failed"
- Check `account.txt` — make sure username and password are correct
- Ensure the account is not locked or suspended on Instagram
- Try logging into `instagram.com` from a browser on the same IP first

### "Checkpoint required"
- Open the Instagram app on your phone and approve the login alert
- Or set `IG_CHECKPOINT_CODE=<code from email/SMS>` and restart

### Rate limited / 429 errors
- Wait 5–10 minutes and retry
- Increase `instagramPolling.minDelay` in `config.json` (e.g. `10000` = 10 seconds)

### Session keeps expiring
- You are using cookie login — switch to **username/password** in `account.txt`
- The bot will re-authenticate automatically when the session expires
- Delete `session.json` to force a fresh login immediately

### 2FA code rejected in non-interactive mode
- Make sure `IG_2FA_CODE` is set **before** starting the bot, not after
- TOTP codes expire in 30 seconds — set the env var just before running

### Canvas / image commands broken
- The `canvas` package needs native graphics libraries
- **Replit:** already configured in `replit.nix` — no action needed
- **Ubuntu/Debian:**
  ```bash
  sudo apt-get install libcairo2-dev libpango1.0-dev libgif-dev libjpeg-dev
  ```

---

## Security Checklist

- [ ] `account.txt` is in `.gitignore` — never commit real credentials
- [ ] `session.json` is in `.gitignore` — contains active session cookies
- [ ] Use **Replit Secrets** or system env vars for cloud deployments
- [ ] Use a **dedicated secondary Instagram account** for the bot
- [ ] Do not share your `session.json` with anyone

---

## License

MIT — see [LICENSE](LICENSE)

---

## Credits

| Contributor | Role |
|-------------|------|
| [NTKhang](https://github.com/ntkhang03) | Original GoatBot V2 framework (Team Calyx) |
| [DongDev](https://github.com/DongDev) | FCA-unofficial library |
| [Gtajisan](https://github.com/Gtajisan) | Instagram port & this codebase |
| [instagrapi](https://github.com/subzeroid/instagrapi) | Reference for Instagram private mobile API |

---

> **Disclaimer:** This project is for educational purposes only.  
> Using automated bots on Instagram may violate their [Terms of Service](https://help.instagram.com/581066165581870).  
> Use responsibly and at your own risk.
