# GoatBot V2 - Instagram Port

## Project Overview
This is the Instagram port of the popular GoatBot V2 Messenger bot. It maintains 100% compatibility with the original GoatBot command structure while running on Instagram Direct Messages.

## Key Features
- **IG-FCA API**: Custom Instagram Chat API that mirrors fb-chat-api structure
- **Cookie-based Authentication**: Login using Instagram cookies from `account.txt`
- **Full Command Support**: All GoatBot V2 commands ported for Instagram
- **Dashboard**: Web dashboard for bot management
- **Database**: JSON-based storage for users, threads, and global data

## Project Structure
```
├── index.js                 # Entry point
├── InstagramGoat.js         # Main bot logic (like Goat.js)
├── ig-chat-api/             # Instagram Chat API (like fb-chat-api)
│   ├── index.js             # API main file
│   └── src/                 # API methods
│       ├── sendMessage.js
│       ├── listenMqtt.js
│       ├── getUserInfo.js
│       ├── getThreadInfo.js
│       └── ...
├── bot/
│   └── login/
│       └── loginIG.js       # Instagram login handler
├── scripts/
│   ├── cmds/                # Bot commands
│   └── events/              # Bot events
├── dashboard/               # Web dashboard
├── database/                # Data storage
├── config.json              # Bot configuration
├── account.txt              # Instagram cookies
└── session.json             # Saved session (auto-generated)
```

## How to Set Up

### 1. Get Instagram Cookies
1. Login to Instagram in your browser
2. Open Developer Tools (F12) → Network tab
3. Refresh the page and find any request to instagram.com
4. Copy cookies: `sessionid`, `ds_user_id`, `csrftoken`, `mid`, `ig_did`, `rur`

### 2. Add Cookies to account.txt
Add cookies in one of these formats:

**JSON Array format:**
```json
[
  {"key": "sessionid", "value": "YOUR_VALUE", "domain": "instagram.com"},
  {"key": "ds_user_id", "value": "YOUR_VALUE", "domain": "instagram.com"},
  {"key": "csrftoken", "value": "YOUR_VALUE", "domain": "instagram.com"}
]
```

**Cookie String format:**
```
sessionid=XXX; ds_user_id=XXX; csrftoken=XXX; mid=XXX; ig_did=XXX; rur=XXX
```

### 3. Configure Bot
Edit `config.json`:
- `adminBot`: Add your Instagram user ID
- `prefix`: Command prefix (default: `/`)
- `nickNameBot`: Bot name

### 4. Run the Bot
```bash
node index.js
```

## Commands
Use `/help` to see all available commands.

## Important Notes
- **Required cookies**: `sessionid`, `ds_user_id` (minimum)
- **Recommended cookies**: `csrftoken`, `mid`, `ig_did`, `rur`
- Keep your cookies secure - never share them
- Sessions expire - update cookies when they become invalid

## User Preferences
- Language: English
- Prefix: `/`
- Database: JSON

## Recent Changes
- Dec 2024: Initial Instagram port created
- IG-FCA API implemented with cookie-based auth
- All commands ported from base GoatBot V2
- Dashboard integration added
