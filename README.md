# GoatBot-IG-Port — GoatBot V2 for Instagram

> **A full-featured Instagram DM + Group Chat bot, ported from NTKhang's GoatBot V2 (Team Calyx).**
> Supports text, photos, reactions, command system, database persistence, and a web dashboard — all running through Instagram's web API using cookie-based sessions.

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Features](#features)
3. [Requirements](#requirements)
4. [Quick Start](#quick-start)
5. [Getting Your Instagram Cookies](#getting-your-instagram-cookies)
6. [Configuration Guide](#configuration-guide)
7. [Account Setup](#account-setup)
8. [Running the Bot](#running-the-bot)
9. [Command System](#command-system)
10. [Writing Commands](#writing-commands)
11. [Writing Event Handlers](#writing-event-handlers)
12. [Database](#database)
13. [Dashboard](#dashboard)
14. [Environment Variables & Secrets](#environment-variables--secrets)
15. [Instagram API Reference](#instagram-api-reference)
16. [Troubleshooting](#troubleshooting)
17. [Project Structure](#project-structure)
18. [Credits](#credits)

---

## What Is This?

GoatBot-IG-Port is a Node.js chatbot that connects to Instagram Direct Messages using cookie-based session authentication (no official API key needed). It is a direct port of [GoatBot V2](https://github.com/ntkhang03/Goat-Bot-V2) — replacing Facebook Messenger's `fca-unofficial` library with a custom `ig-chat-api` layer that communicates with Instagram's internal web endpoints.

The bot uses **HTTP polling** (not WebSockets/MQTT) to check for new messages every few seconds, dispatch them through GoatBot V2's full command/event pipeline, and reply back via the same session.

---

## Features

| Feature | Status |
|---|---|
| DM (1-on-1) messages | ✅ Full support |
| Group chat messages | ✅ Full support |
| Text messages | ✅ |
| Photo / video attachments | ✅ |
| Message reactions (emoji) | ✅ |
| Reply-to-message | ✅ |
| Unsend / delete message | ✅ |
| Typing indicator | ✅ |
| Mark as read | ✅ |
| Add / remove group members | ✅ |
| Set group title | ✅ |
| Change group photo | ✅ |
| Create new group | ✅ |
| Follow / unfollow user | ✅ |
| Block / unblock user | ✅ |
| Accept message requests | ✅ |
| GoatBot V2 command system | ✅ Full pipeline |
| GoatBot V2 event system | ✅ Full pipeline |
| JSON / SQLite / MongoDB database | ✅ |
| Per-thread prefix, language, settings | ✅ |
| Admin roles (bot admin / group admin) | ✅ |
| Anti-inbox (ignore DMs) | ✅ |
| Web dashboard | ✅ |
| Session auto-save | ✅ |

---

## Requirements

- **Node.js 20.x** (already configured for Replit)
- An **Instagram account** — a dedicated bot account is strongly recommended
- The account's **session cookies** (see [Getting Your Instagram Cookies](#getting-your-instagram-cookies))
- The account must **not require interactive login** at runtime (cookies bypass the login page)

---

## Quick Start

```bash
# 1. Install dependencies (run once, already done on Replit)
npm install --legacy-peer-deps

# 2. Paste your Instagram cookies into account.txt (see below)

# 3. Edit config.json — at minimum set your adminBot numeric user ID

# 4. Start the bot
node index.js
```

On Replit, just click **Run** — the `GoatBot Instagram` workflow is already configured.

---

## Getting Your Instagram Cookies

The bot authenticates using your browser's Instagram session cookies.  
You need at minimum: **`sessionid`** and **`ds_user_id`**.

### Method 1 — Browser DevTools (Most Reliable)

1. Open **https://www.instagram.com** in Chrome or Firefox and log in as your bot account.
2. Press **F12** → go to the **Application** tab (Chrome) or **Storage** tab (Firefox).
3. Navigate to **Cookies → https://www.instagram.com**.
4. Copy the values of these cookies:

   | Cookie name | Required |
   |---|---|
   | `sessionid` | **Yes** |
   | `ds_user_id` | **Yes** |
   | `csrftoken` | Yes |
   | `mid` | Recommended |
   | `ig_did` | Recommended |

5. Paste into `account.txt` as a cookie string:
   ```
   sessionid=YOUR_SESSION_ID; ds_user_id=YOUR_USER_ID; csrftoken=YOUR_CSRF_TOKEN; mid=YOUR_MID;
   ```

### Method 2 — Cookie Editor Extension (Easiest)

1. Install **[Cookie Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)** in Chrome.
2. Log in to instagram.com as your bot account.
3. Click the extension icon → **Export** → **Export as JSON**.
4. Paste the full JSON array directly into `account.txt`.

### Method 3 — curl / wget

If you have an existing `sessionid`, you can build the cookie string manually and paste it as plain text.

> ⚠️ **Security:** Never share `account.txt`. These cookies grant full access to your Instagram account. Always use a dedicated bot account.

> ℹ️ **Session lifespan:** Instagram sessions typically last 30–90 days. If the bot stops responding with a 401/403 error, refresh your cookies.

---

## Configuration Guide

Edit **`config.json`** in the project root to customise the bot's behaviour.

```json
{
  "adminBot": [123456789],
  "prefix": "/",
  "language": "en",
  "timeZone": "Asia/Dhaka",
  "database": { "type": "json" },
  "dashBoard": { "enable": true, "port": 3001 }
}
```

### Full Config Reference

| Key | Type | Default | Description |
|---|---|---|---|
| `adminBot` | `number[]` | `[]` | Numeric Instagram user IDs with full admin access |
| `prefix` | `string` | `"/"` | Command prefix — e.g. `/help` |
| `language` | `string` | `"en"` | Bot language (`"en"` or `"vi"`) |
| `timeZone` | `string` | `"Asia/Dhaka"` | Timezone used by `getTime()` in commands |
| `nickNameBot` | `string` | `"GoatBot-IG"` | Bot display name used in some responses |
| `antiInbox` | `boolean` | `false` | If `true`, ignore all DMs; only respond in groups |
| `database.type` | `string` | `"json"` | DB backend: `"json"`, `"sqlite"`, or `"mongodb"` |
| `database.uriMongodb` | `string` | `""` | MongoDB connection URI (only needed for `"mongodb"`) |
| `database.autoSyncWhenStart` | `boolean` | `false` | Refresh all thread info on startup |
| `database.autoRefreshThreadInfoFirstTime` | `boolean` | `true` | Refresh thread info on first message in each thread |
| `dashBoard.enable` | `boolean` | `true` | Enable the web dashboard |
| `dashBoard.port` | `number` | `3001` | Dashboard HTTP port |
| `adminOnly.enable` | `boolean` | `false` | If `true`, only `adminBot` users can use commands |
| `adminOnly.ignoreCommand` | `string[]` | `[]` | Commands exempt from the adminOnly restriction |
| `whiteListMode.enable` | `boolean` | `false` | If `true`, only whitelisted IDs can interact with the bot |
| `whiteListMode.whiteListIds` | `string[]` | `[]` | Allowed user / thread IDs |
| `hideNotiMessage.commandNotFound` | `boolean` | `false` | Suppress "command not found" replies |
| `hideNotiMessage.adminOnly` | `boolean` | `false` | Suppress "admin only" replies |
| `optionsFca.selfListen` | `boolean` | `false` | React to the bot's own messages |
| `optionsFca.autoMarkDelivery` | `boolean` | `false` | Auto-mark every message as seen |
| `optionsFca.autoReconnect` | `boolean` | `true` | Auto-reconnect polling on errors |
| `instagramPolling.minDelay` | `number` | `5000` | Min ms between polls |
| `instagramPolling.maxDelay` | `number` | `120000` | Max backoff delay on errors |

### Finding Your Instagram Numeric User ID

Your numeric user ID is different from your `@username`. Find it like this:

1. While logged in, open: `https://www.instagram.com/api/v1/accounts/current_user/?edit=true`
2. Look for `"pk"` in the JSON — that number is your user ID.
3. Paste it into `adminBot` in `config.json`:
   ```json
   "adminBot": [12345678901]
   ```

---

## Account Setup

### `account.txt`

Create this file in the project root and paste your cookie string (or JSON array) into it.

**Plain string format:**
```
sessionid=XXXXX; ds_user_id=XXXXX; csrftoken=XXXXX; mid=XXXXX;
```

**JSON array format** (from Cookie Editor export):
```json
[
  { "name": "sessionid",  "value": "...", "domain": ".instagram.com" },
  { "name": "ds_user_id", "value": "...", "domain": ".instagram.com" },
  { "name": "csrftoken",  "value": "...", "domain": ".instagram.com" }
]
```

The file is parsed at startup. Change it and restart the bot to use new cookies.

---

## Running the Bot

### On Replit

Click **Run**. The `GoatBot Instagram` workflow executes `node index.js`.

To see live logs, open the **Console** panel.

### Locally

```bash
node index.js
```

### Boot Sequence

When the bot starts, it goes through these stages in order:

| Stage | File | What happens |
|---|---|---|
| 1 | `index.js` | Entry point — loads InstagramGoat.js |
| 2 | `InstagramGoat.js` | Sets up `global.GoatBot`, `global.db`, `global.utils`, `global.temp` |
| 3 | `bot/login/loginIG.js` | Parses cookies → authenticates to Instagram → saves `session.json` |
| 4 | `bot/login/loadData.js` | Connects database; loads all thread and user records into memory |
| 5 | `bot/login/loadScripts.js` | Loads commands from `scripts/cmds/` and events from `scripts/events/` |
| 6 | `bot/custom.js` | Runs your custom startup code |
| 7 | `bot/handler/handlerAction.js` | Creates the main event dispatcher |
| 8 | `dashboard/app.js` | Starts the web dashboard (if enabled) |
| 9 | `ig-chat-api` | Begins polling Instagram — the bot is now live |

---

## Command System

Commands live in **`scripts/cmds/`**. Each file exports a `config` object and one or more lifecycle functions.

### Minimal Command

```js
// scripts/cmds/ping.js
module.exports = {
  config: {
    name: "ping",
    version: "1.0",
    author: "You",
    countDown: 5,        // cooldown in seconds
    role: 0,             // 0=everyone  1=group admin  2=bot admin
    shortDescription: { en: "Check if the bot is alive" },
    category: "info"
  },
  onStart: async ({ message }) => {
    message.reply("🏓 Pong!");
  }
};
```

### Lifecycle Functions

| Function | When it runs |
|---|---|
| `onStart` | User sends the command (e.g. `/ping`) |
| `onChat` | Every message in any thread (no prefix needed) |
| `onReply` | Someone replies to a message this command previously sent |
| `onReaction` | Someone reacts to a message this command previously sent |

### Parameters Available in Every Lifecycle

| Parameter | Type | Description |
|---|---|---|
| `api` | Object | Raw Instagram API object |
| `event` | Object | Incoming event |
| `args` | `string[]` | Words after the command name |
| `message` | Object | Helper: `.reply()` `.send()` `.reaction()` `.unsend()` `.err()` |
| `prefix` | `string` | Active prefix for this thread |
| `role` | `number` | Sender's role: 0 / 1 / 2 |
| `getLang` | `function` | Get localised text from `langs` |
| `usersData` | Object | User database controller |
| `threadsData` | Object | Thread database controller |
| `globalData` | Object | Global key-value store |
| `dashBoardData` | Object | Dashboard DB controller |
| `envCommands` | Object | Per-command env config from `configCommands.json` |

### The `message` Helper

```js
// Reply quoting the user's message
await message.reply("Hello!");

// Send to same thread (no quote)
await message.send("Hello!");

// React to the user's message
await message.reaction("❤️");

// Delete a previously sent message
await message.unsend(messageID);

// Send a formatted error (uses lang file)
await message.err(new Error("Something went wrong"));
```

---

## Writing Commands

### Echo command

```js
module.exports = {
  config: {
    name: "echo",
    version: "1.0",
    author: "You",
    role: 0,
    shortDescription: { en: "Echo your text back" },
    category: "utility",
    guide: { en: "{pn} <text>" }   // {pn} = prefix + name
  },
  onStart: async ({ args, message }) => {
    if (!args.length) return message.reply("Please provide some text.");
    message.reply(args.join(" "));
  }
};
```

### Sending a photo

```js
const axios = require("axios");

module.exports = {
  config: { name: "meme", version: "1.0", author: "You", role: 0,
    shortDescription: { en: "Random meme image" }, category: "fun" },
  onStart: async ({ api, event }) => {
    const res = await axios.get("https://picsum.photos/500", { responseType: "stream" });
    await api.sendMessage(
      { body: "Here is a random image!", attachment: res.data },
      event.threadID
    );
  }
};
```

### Using the database

```js
module.exports = {
  config: { name: "balance", version: "1.0", author: "You", role: 0,
    shortDescription: { en: "Check your coin balance" }, category: "economy" },
  onStart: async ({ event, usersData, message }) => {
    const user = await usersData.get(event.senderID);
    message.reply(`Your balance: 💰 ${user.data.money || 0} coins`);
  }
};
```

### Multi-language support

```js
module.exports = {
  config: { name: "greet", version: "1.0", author: "You", role: 0,
    shortDescription: { en: "Greeting command" }, category: "fun" },
  langs: {
    en: { hello: "Hello, %1! You have %2 coins." },
    vi: { hello: "Xin chào, %1! Bạn có %2 coin." }
  },
  onStart: async ({ event, usersData, getLang }) => {
    const user = await usersData.get(event.senderID);
    return getLang("hello", user.name, user.data.money || 0);
  }
};
```

### onReply example

```js
module.exports = {
  config: { name: "ask", version: "1.0", author: "You", role: 0,
    shortDescription: { en: "Ask a question, wait for reply" }, category: "utility" },
  onStart: async ({ message, event }) => {
    const info = await message.reply("What is your favourite colour?");
    global.GoatBot.onReply.set(info.messageID, {
      commandName: "ask",
      author: event.senderID
    });
  },
  onReply: async ({ event, message, Reply }) => {
    if (event.senderID !== Reply.author) return;
    message.reply(`Nice! You like ${event.body}.`);
  }
};
```

---

## Writing Event Handlers

Event handlers live in **`scripts/events/`** and run on every incoming event.

```js
// scripts/events/welcome.js
module.exports = {
  config: {
    name: "welcome",
    eventType: ["log:subscribe"],
    version: "1.0",
    author: "You",
    description: { en: "Welcome new group members" }
  },
  onEvent: async ({ api, event, message }) => {
    const added = event.logMessageData?.addedParticipants || [];
    for (const user of added) {
      await message.send(
        `👋 Welcome to the group, ${user.fullName || "new member"}!`
      );
    }
  }
};
```

### Event Types

| `eventType` | Fired when |
|---|---|
| `message` | Any text message arrives |
| `message_reply` | A reply-to-message arrives |
| `message_reaction` | A reaction is added or removed |
| `log:subscribe` | Someone is added to a group |
| `log:unsubscribe` | Someone leaves or is removed from a group |
| `event` | Any generic action event |

---

## Database

### Backends

| Type | Setup | Best for |
|---|---|---|
| `json` | None — zero config | Small bots, development |
| `sqlite` | None — zero config | Medium bots, persistent data |
| `mongodb` | Set `uriMongodb` in config | Large bots, multiple instances |

Change in `config.json`:
```json
"database": { "type": "sqlite" }
```

```json
"database": {
  "type": "mongodb",
  "uriMongodb": "mongodb+srv://user:pass@cluster.mongodb.net/goatbot"
}
```

### Controllers

| Controller | Stores |
|---|---|
| `usersData` | Per-user data: name, money, exp, custom `data`, ban status |
| `threadsData` | Per-thread data: name, admin IDs, members, prefix, language, custom `data` |
| `dashBoardData` | Dashboard accounts / sessions |
| `globalData` | Global key-value store (bot-wide settings) |

### Common Operations

```js
// ── Users ──────────────────────────────────────────────
const user = await usersData.get(userID);
// { userID, name, money, exp, data: {}, banned: { status: false } }

await usersData.set(userID, { money: user.money + 100 });
await usersData.set(userID, { data: { ...user.data, level: 5 } });

// ── Threads ─────────────────────────────────────────────
const thread = await threadsData.get(threadID);
// { threadID, threadName, adminIDs, members, data: {}, banned: {} }

await threadsData.set(threadID, { data: { ...thread.data, prefix: "!" } });

// ── Global ──────────────────────────────────────────────
await globalData.set("key", "value");
const val = await globalData.get("key");
```

---

## Dashboard

When `dashBoard.enable` is `true`, the bot starts an Express web app on `dashBoard.port` (default `3001`).

On **Replit**, the dashboard is accessible from the **Webview** tab after the bot starts (it runs on the configured port, visible via the Replit proxy).

The dashboard lets you:
- View online threads and users
- Monitor command usage
- Manage bans and admin roles
- Set per-thread options

Login credentials are configured in `dashboard/` and linked to `adminBot` user IDs.

---

## Environment Variables & Secrets

Sensitive values should go in Replit **Secrets** (or a local `.env` file) — never hard-code them in tracked files.

To add a secret on Replit: click the 🔒 **Secrets** panel → add key and value.

Access in code:
```js
const mySecret = process.env.MY_SECRET_KEY;
```

| Variable | Description |
|---|---|
| `NODE_ENV` | `"production"` or `"development"` |
| `MONGODB_URI` | MongoDB connection URI (alternative to setting in config.json) |

---

## Instagram API Reference

The `ig-chat-api` layer exposes these methods on the `api` object passed to every command and event handler.

### Messaging

```js
// Send text, photo, or video to a thread
api.sendMessage(msg, threadID, [replyToMessageID], [callback])
// msg can be a string or { body: "text", attachment: stream | filePath | url }

// Delete / unsend a message
api.unsendMessage(messageID, threadID, [callback])

// Set an emoji reaction on a message
api.setMessageReaction(emoji, messageID, threadID, [callback])

// Show "typing..." indicator
api.sendTypingIndicator(threadID, [callback])
```

### Thread Info

```js
// Get info about a thread (DM or group)
api.getThreadInfo(threadID, [callback])
// Returns: { threadID, name, isGroup, adminIDs, participantIDs, emoji, ... }

// Get inbox thread list
api.getThreadList(limit, timestamp, tags, [callback])

// Get message history
api.getThreadHistory(threadID, count, timestamp, [callback])
```

### User Info

```js
// Get profile info for one or more user IDs
api.getUserInfo(userID | userID[], [callback])
// Returns: { [userID]: { name, firstName, profilePicture, isBirthday, ... } }

// Get numeric user ID from Instagram username
api.getUserID(username | username[], [callback])

// Get profile picture URL
api.getAvatarUser(userID | userID[], [callback])
```

### Group Management

```js
api.addUserToGroup(userID | userID[], threadID, [callback])
api.removeUserFromGroup(userID, threadID, [callback])
api.setTitle(title, threadID, [callback])
api.changeGroupImage(imageStream | filePath, threadID, [callback])
api.createNewGroup(participantIDs[], [title], [callback])
api.changeAdminStatus(threadID, adminIDs[], isAdmin, [callback])
```

### Session & Utils

```js
api.getCurrentUserID()       // → bot's numeric IG user ID (string)
api.getAppState()            // → current cookie array
api.setOptions(options)      // update runtime options
api.getOptions()             // → current global options
api.getRegion()              // → "IG"
api.listenMqtt(callback)     // start polling — callback(err, event)
api.stopListenMqtt()         // stop polling
api.markAsRead(threadID, [callback])
api.follow(userID, [callback])
api.unfriend(userID, [callback])
api.handleMessageRequest(threadID, accept, [callback])
api.logout([callback])
```

### Event Object Shape

```js
{
  type          : "message" | "event",
  senderID      : "12345678901",    // sender's numeric Instagram user ID
  threadID      : "99887766554",    // thread ID
  messageID     : "29:1:...",
  body          : "Hello!",         // message text (empty for media-only)
  attachments   : [
    { type: "photo" | "video" | "audio", url: "...", ID: "..." }
  ],
  isGroup       : true,
  participantIDs: ["111", "222"],
  threadName    : "My Group",
  adminIDs      : [{ id: "111" }],
  timestamp     : 1720000000000,
  isEcho        : false             // true = sent by the bot itself
}
```

For reaction events:
```js
{
  type       : "message_reaction",
  reaction   : "❤️",
  messageID  : "...",
  userID     : "...",
  threadID   : "..."
}
```

---

## Troubleshooting

### "Missing required cookies: sessionid, ds_user_id"

Your `account.txt` is empty or missing those keys. Re-export cookies from your browser (see [Getting Your Instagram Cookies](#getting-your-instagram-cookies)).

### Bot starts but no messages arrive

- Check logs for `[ig-chat-api] ✓ Initial sync done` — if absent, the poll failed.
- The session may be rate-limited. Look for `Rate limited — cooling down`.
- Send a DM to the bot account from another account and wait ~10 seconds.
- Try lowering `instagramPolling.minDelay` to `3000` in `config.json`.

### "Session expired (401/403) — stopping listener"

Your cookies expired. Log in to instagram.com in your browser, re-export cookies, replace `account.txt`, and restart.

### Commands don't respond

- The default prefix is `/`. Try `/help`.
- If `adminOnly.enable` is `true` in `config.json`, only `adminBot` users can run commands.
- Check startup logs for `[ERROR]` lines in the `LOAD COMMANDS` section.

### "Cannot find module 'xyz'"

```bash
npm install --legacy-peer-deps
```

### Database errors on first run

```bash
mkdir -p database/data
echo "[]" > database/data/threadsData.json
echo "[]" > database/data/usersData.json
echo "[]" > database/data/dashBoardData.json
echo "[]" > database/data/globalData.json
```

### Rate limiting / 429 errors

- Increase `instagramPolling.minDelay` to `10000`–`15000`.
- Use a dedicated Instagram account not flagged for spam.
- Avoid rapid repeated messages (the send rate limit is ~1 per second).

### Session keeps expiring quickly

Instagram sessions last longer on accounts that:
- Are older (> 6 months)
- Have profile photos and bios set
- Have prior login history from a real device

---

## Project Structure

```
GoatBot-IG-Port/
│
├── index.js                     ← Entry point
├── InstagramGoat.js             ← Global setup (GoatBot, db, utils, temp)
├── config.json                  ← Main configuration
├── configCommands.json          ← Per-command environment config
├── account.txt                  ← Your Instagram session cookies  ← YOU PROVIDE THIS
├── session.json                 ← Auto-saved session state
│
├── ig-chat-api/                 ← Custom Instagram API layer
│   ├── index.js                 ← Login + buildAPI() factory
│   └── src/
│       ├── listenMqtt.js        ← HTTP polling engine (DMs + Groups)
│       ├── sendMessage.js       ← Text + photo/video sending
│       ├── getUserInfo.js
│       ├── getThreadInfo.js
│       ├── getThreadList.js
│       ├── getThreadHistory.js
│       ├── markAsRead.js
│       ├── sendTypingIndicator.js
│       ├── setMessageReaction.js
│       ├── unsendMessage.js
│       ├── addUserToGroup.js
│       ├── removeUserFromGroup.js
│       ├── createNewGroup.js
│       ├── setTitle.js
│       ├── changeGroupImage.js
│       ├── uploadAttachment.js
│       └── ...                  ← 20+ additional method files
│
├── bot/
│   ├── login/
│   │   ├── loginIG.js           ← Full boot sequence
│   │   ├── loadData.js          ← Database initialisation
│   │   ├── loadScripts.js       ← Command + event loader
│   │   └── handlerWhenListenHasError.js
│   ├── handler/
│   │   ├── handlerAction.js     ← Main event router
│   │   ├── handlerEvents.js     ← GoatBot V2 command/event pipeline
│   │   └── handlerCheckData.js  ← Auto-create missing DB entries
│   └── custom.js                ← Your custom startup code
│
├── scripts/
│   ├── cmds/                    ← Command files (.js)  83 built-in
│   └── events/                  ← Event handler files (.js)
│
├── database/
│   ├── controller/              ← DB abstraction (threadsData, usersData, ...)
│   ├── connectDB/               ← SQLite + MongoDB connectors
│   └── data/                    ← JSON storage files (auto-created)
│
├── dashboard/                   ← Web dashboard (Express)
├── languages/                   ← Lang files (en.lang, vi.lang)
├── logger/                      ← Logging utilities
├── func/                        ← Utility functions (colors, prism)
└── utils.js                     ← Shared utils (message, getText, log, ...)
```

---

## Credits

| Who | Role |
|---|---|
| [NTKhang03 / Team Calyx](https://github.com/ntkhang03/Goat-Bot-V2) | Original GoatBot V2 — core pipeline, DB layer, command system, 80+ built-in commands |
| Gtajisan | Instagram port — `ig-chat-api`, `loginIG.js`, IG-specific adapters, Replit setup |

This project is open source under the MIT licence.  
Original GoatBot V2: https://github.com/ntkhang03/Goat-Bot-V2
