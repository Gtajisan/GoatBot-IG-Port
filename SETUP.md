# GoatBot-IG-Port — Setup Guide

> Instagram Bot based on [InstaBOT](https://github.com/Gtajisan/InstaBOT) by Gtajisan  
> All GoatBot V2 commands are preserved and run inside the new architecture.

---

## Quick Start

### 1. Add Your Instagram Credentials

**Option A — Cookie Login (Recommended, more stable):**

1. Log in to Instagram in your browser
2. Open DevTools → Application → Cookies → `instagram.com`
3. Export cookies in **Netscape format** using the [Cookie-Editor](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm) browser extension
4. Paste the exported cookies into `account.txt`

Your `account.txt` should look like:
```
# Netscape HTTP Cookie File
#HttpOnly_.instagram.com	TRUE	/	TRUE	1816927338	sessionid	YOUR_SESSION_ID
.instagram.com	TRUE	/	TRUE	1790143340	ds_user_id	YOUR_USER_ID
.instagram.com	TRUE	/	TRUE	1816927340	csrftoken	YOUR_CSRFTOKEN
```

**Option B — Username/Password Login:**

Set environment variables in Replit Secrets:
```
IG_USERNAME = your_instagram_username
IG_PASSWORD = your_instagram_password
```

---

### 2. Configure the Bot

Edit `config/default.json`:

| Field | Description |
|-------|-------------|
| `prefix` | Command prefix (default: `/`) |
| `adminBot` | Your Instagram user ID (get it with `/uid`) |
| `nickNameBot` | Bot display name |
| `timeZone` | Your timezone (e.g. `Asia/Dhaka`) |
| `language` | Bot language: `en` or `vi` |

---

### 3. Run the Bot

Click the **Run** button in Replit, or:
```bash
npm start
```

---

## Login System (InstaBOT Style)

The bot uses `@neoaz07/nkxica` — the same API as [InstaBOT](https://github.com/Gtajisan/InstaBOT).

**Login priority:**
1. **Valid cookies in `account.txt`** — checked first (most stable)
2. **`IG_USERNAME` + `IG_PASSWORD` env vars** — used if no valid cookies found
3. **`instagramAccount.email` + `instagramAccount.password` in `config/default.json`** — fallback

**Auto cookie refresh:**  
If you use email/password login, set `autoRefreshFbstate: true` and `intervalGetNewCookie: 1440` (minutes) to keep your session alive automatically.

---

## Commands (80+)

All original GoatBot V2 commands are preserved in `commands/`. Use `PREFIX` to invoke:

| Category | Commands |
|----------|---------|
| Economy | `/balance`, `/daily`, `/pay` |
| Rank | `/rank`, `/rankup` |
| AI | `/gpt`, `/translate` |
| Admin | `/admin`, `/ban`, `/kick` |
| Info | `/help`, `/uid`, `/tid`, `/info` |
| Fun | `/guessnumber`, `/choose`, `/moon` |
| Media | `/sing`, `/video`, `/ytb` |
| Tools | `/weather`, `/translate`, `/paste` |
| System | `/cmd`, `/restart`, `/shell` |

Type `PREFIX help` for the full list.

---

## File Structure

```
/
├── index.js                  # Entry point
├── bot/
│   └── InstagramBot.js       # Core bot (InstaBOT login system)
├── config/
│   ├── default.json          # All bot settings
│   └── index.js              # Config loader
├── commands/                 # All 80+ bot commands
├── events/                   # Event handlers
├── utils/
│   ├── logger.js             # Winston logger
│   ├── database.js           # JSON/SQLite database
│   ├── permissions.js        # Role system (0-4)
│   ├── moderation.js         # Whitelist, spam protection
│   ├── commandLoader.js      # Loads commands/ folder
│   ├── eventLoader.js        # Loads events/ folder
│   ├── configManager.js      # Dynamic config read/write
│   └── goatcompat.js         # GoatBot V2 ↔ InstaBOT bridge
├── account.txt               # Instagram cookies (Netscape format)
└── storage/
    ├── data/database.json    # Bot data (users, threads, economy)
    └── logs/                 # Log files
```

---

## Role System

| Role | Who | Level |
|------|-----|-------|
| 0 | Normal users | All commands with `role: 0` |
| 1 | Group admins | Group-admin commands |
| 2 | Bot admins | `adminBot` list in config |
| 3 | Premium users | `premiumUsers` list |
| 4 | Developers | `devUsers` list (full access) |

---

## Troubleshooting

**Bot won't log in:**
- Make sure `account.txt` has valid cookies with `sessionid`
- Or set `IG_USERNAME` / `IG_PASSWORD` in Replit Secrets
- Instagram may require 2FA — use cookie login instead

**Commands not loading:**
- Check `storage/logs/error.log` for errors
- Commands must export a `config.name` field

**Rate limits / 429 errors:**
- The bot has built-in typing delay and rate limiting
- Reduce `optionsFca.maxRequestsPerMinute` in config

---

## Credits

- **InstaBOT** — [Gtajisan](https://github.com/Gtajisan/InstaBOT) (login system, bot architecture)
- **GoatBot V2** — [NTKhang](https://github.com/ntkhang03) (original command framework)
- **nkxica** — [@neoaz07](https://www.npmjs.com/package/@neoaz07/nkxica) (Instagram API)
