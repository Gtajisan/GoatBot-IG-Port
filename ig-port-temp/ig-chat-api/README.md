# ig-chat-api

**Instagram Chat API** - FCA-compatible wrapper for Instagram Messaging API (Graph API)

Drop-in replacement for `fb-chat-api` / `fca-unofficial` that works with Instagram instead of Facebook Messenger.

## Features

- Same API as fb-chat-api - no code changes needed in your bot
- Uses official Instagram Graph API (safe, no account bans)
- Webhook-based real-time message receiving
- Full FCA event format compatibility
- Works with GoatBot V2 and other FCA-based bots

## Installation

```bash
npm install ig-chat-api
```

Or copy the `ig-chat-api` folder to your project.

## Quick Start

```javascript
const login = require("ig-chat-api");

login({
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    igUserID: process.env.INSTAGRAM_PAGE_ID,
    verifyToken: process.env.INSTAGRAM_VERIFY_TOKEN
}, (err, api) => {
    if (err) return console.error(err);
    
    console.log("Logged in!");
    
    api.listen((err, event) => {
        if (err) return console.error(err);
        
        console.log("Message received:", event.body);
        
        if (event.body === "ping") {
            api.sendMessage("pong!", event.threadID);
        }
    });
});
```

## API Reference

### login(credentials, callback)

Initialize the API with your Instagram credentials.

```javascript
login({
    accessToken: "YOUR_PAGE_ACCESS_TOKEN",
    igUserID: "YOUR_INSTAGRAM_PAGE_ID",       // or pageID
    verifyToken: "YOUR_WEBHOOK_VERIFY_TOKEN"  // optional, defaults to "goatbot_ig_verify"
}, (err, api) => { ... });
```

**Environment Variables (alternative):**
- `INSTAGRAM_ACCESS_TOKEN` or `IG_ACCESS_TOKEN`
- `INSTAGRAM_PAGE_ID` or `IG_USER_ID`
- `INSTAGRAM_VERIFY_TOKEN` or `IG_VERIFY_TOKEN`

### api.listen(callback)

Start listening for incoming messages.

```javascript
const stopListening = api.listen((err, event) => {
    if (err) return console.error(err);
    
    // event format (same as fb-chat-api):
    // {
    //     type: "message",
    //     senderID: "123456789",
    //     threadID: "123456789",
    //     messageID: "mid.xxxxx",
    //     body: "Hello!",
    //     attachments: [],
    //     timestamp: 1234567890123,
    //     isGroup: false
    // }
});

// Stop listening when needed
stopListening();
```

### api.sendMessage(message, threadID, callback, replyToMessage)

Send a message to a thread.

```javascript
// Send text
api.sendMessage("Hello!", threadID);

// Send with object (FCA-style)
api.sendMessage({ body: "Hello!" }, threadID);

// Send with attachment
api.sendMessage({
    body: "Check this image!",
    attachment: fs.createReadStream("image.jpg")
}, threadID);

// Reply to a message
api.sendMessage("Reply!", threadID, null, originalMessageID);

// With callback
api.sendMessage("Hello!", threadID, (err, info) => {
    console.log("Message sent:", info.messageID);
});
```

### api.getUserInfo(userIDs, callback)

Get user information.

```javascript
api.getUserInfo("123456789", (err, info) => {
    console.log(info);
    // {
    //     "123456789": {
    //         name: "John Doe",
    //         firstName: "John",
    //         vanity: "johndoe",
    //         thumbSrc: "https://...",
    //         profileUrl: "https://instagram.com/johndoe",
    //         ...
    //     }
    // }
});
```

### api.getThreadInfo(threadID, callback)

Get thread/conversation information.

```javascript
api.getThreadInfo("123456789", (err, info) => {
    console.log(info);
    // {
    //     threadID: "123456789",
    //     threadName: "John Doe",
    //     participantIDs: ["123456789", "987654321"],
    //     isGroup: false,
    //     ...
    // }
});
```

### api.getThreadList(limit, timestamp, tags, callback)

Get list of conversations.

```javascript
api.getThreadList(20, null, [], (err, threads) => {
    console.log(threads);
});
```

### api.markAsRead(threadID, callback)

Mark a conversation as read.

```javascript
api.markAsRead(threadID);
```

### api.sendTypingIndicator(threadID, callback)

Show typing indicator.

```javascript
const end = await api.sendTypingIndicator(threadID);
// ... do something
end(); // stop typing
```

### api.getCurrentUserID()

Get the bot's page/user ID.

```javascript
const botID = api.getCurrentUserID();
```

## Event Types

Same event types as fb-chat-api:

- `message` - Regular message
- `message_reaction` - Reaction to a message
- `read_receipt` - Message read notification
- `delivery` - Message delivered notification

## Webhook Setup

1. Set up your Instagram Business account
2. Create a Facebook App with Instagram permissions
3. Configure webhook URL: `https://your-domain.com/webhook`
4. Set verify token in environment variables
5. Subscribe to `messages` webhook field

## GoatBot Integration

To use with GoatBot V2, simply change the require:

```javascript
// Before (fb-chat-api)
const login = require("fb-chat-api");

// After (ig-chat-api)
const login = require("ig-chat-api");
```

The rest of your GoatBot code works unchanged!

## Environment Variables

```env
INSTAGRAM_ACCESS_TOKEN=your_page_access_token
INSTAGRAM_PAGE_ID=your_instagram_page_id
INSTAGRAM_VERIFY_TOKEN=your_webhook_verify_token
```

## Requirements

- Node.js 14+
- Instagram Business/Creator account
- Facebook App with Instagram messaging permissions
- Page Access Token with required scopes

## License

MIT

## Credits

- Original fb-chat-api concept
- Instagram Graph API documentation
- GoatBot V2 team
