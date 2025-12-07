# GoatBot V2 - Instagram Port

## Credits
- **Developer:** Gtajisan
- **Instagram Port Author:** Gtajisan
- **Based on:** NTKhang's GoatBot V2 (Team Calyx)
- **fb-chat-api Credits:** DongDev, NTKhang, Team Calyx
- **Source:** https://github.com/Team-Calyx/GoatBot-V2

## Project Overview
Complete port of GoatBot V2 from Facebook Messenger to Instagram Direct Messages. Maintains 100% structural compatibility with the original base while implementing Instagram-specific API logic.

## Key Features
- **ig-chat-api**: Custom Instagram Chat API (37+ functions) mirroring fb-chat-api structure
- **Cookie-based Authentication**: Login using Instagram cookies from `account.txt`
- **80 Commands**: Full command suite ported from base GoatBot V2
- **7 Events**: All event handlers ported with Instagram logic
- **Polling Listener**: Message polling (Instagram doesn't support MQTT like Facebook)
- **JSON Database**: Simple file-based database for users, threads, global data

## Project Structure
```
GoatBot-IG-Port/
├── InstagramGoat.js          # Main entry point (mirrors Goat.js)
├── index.js                  # Alternative entry point
├── config.json               # Bot configuration
├── configCommands.json       # Command configuration
├── account.txt               # Instagram cookies (required)
├── ig-chat-api/              # Instagram Chat API module
│   ├── index.js              # Main API with login/auth
│   ├── utils.js              # Utility functions
│   └── src/                  # API functions (37+)
├── bot/
│   ├── login/
│   │   ├── loginIG.js        # Instagram login handler
│   │   └── ...               # Other login utilities
│   └── handler/              # Event/message handlers
├── scripts/
│   ├── cmds/                 # 80 commands
│   └── events/               # 7 events
├── languages/                # Multi-language support
├── func/                     # Utility functions
├── logger/                   # Logging system
├── dashboard/                # Web dashboard
└── database/                 # JSON database files
```

## ig-chat-api Functions (37+)
| Function | Description | Instagram Support |
|----------|-------------|-------------------|
| sendMessage | Send text/attachment messages | ✅ Full |
| listenMqtt | Listen for new messages (polling) | ✅ Polling |
| getUserInfo | Get user profile info | ✅ Full |
| getThreadInfo | Get thread/conversation info | ✅ Full |
| getThreadList | Get list of conversations | ✅ Full |
| getThreadHistory | Get message history | ✅ Full |
| addUserToGroup | Add user to group chat | ✅ Limited |
| removeUserFromGroup | Remove user from group | ✅ Limited |
| createNewGroup | Create new group chat | ✅ Full |
| setTitle | Set group chat title | ✅ Full |
| muteThread | Mute thread notifications | ✅ Full |
| markAsRead | Mark messages as read | ✅ Full |
| unsendMessage | Delete/unsend message | ✅ Full |
| setMessageReaction | React to message | ✅ Full |
| follow | Follow a user | ✅ Full |
| unfriend | Unfollow a user | ✅ Full |
| changeBlockedStatus | Block/unblock user | ✅ Full |
| getFriendsList | Get following list | ✅ Full |
| getUserID | Get user ID from username | ✅ Full |
| searchForThread | Search conversations | ✅ Full |
| ... | And more | Various |

## Setup Instructions
1. Get your Instagram cookies from browser DevTools
2. Add cookies to `account.txt` in format:
   ```
   sessionid=xxx; ds_user_id=xxx; csrftoken=xxx; rur=xxx;
   ```
   Or JSON array format:
   ```json
   [{"key":"sessionid","value":"xxx"},{"key":"ds_user_id","value":"xxx"}]
   ```
3. Edit `config.json` to set prefix, adminBot IDs, etc.
4. Run `node index.js` or `node InstagramGoat.js`

## Required Cookies
- `sessionid` - Session authentication token
- `ds_user_id` - Your Instagram user ID
- `csrftoken` - CSRF protection token
- `rur` - Region routing (optional but recommended)

## Configuration (config.json)
- `prefix`: Command prefix (default: `/`)
- `adminBot`: Array of admin user IDs
- `language`: Bot language (`en`, `vi`, etc.)
- `instagramAccount.userAgent`: Browser user agent

## User Agent
```
Mozilla/5.0 (Linux; Android 12; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36
```

## Notes
- 401 errors indicate invalid/expired Instagram cookies
- Instagram uses polling instead of MQTT for message listening
- Some Facebook-specific features have limited or no Instagram support
- Rate limits apply - respect Instagram's API limits
