
# Instagram GoatBot Setup Guide

## Prerequisites

1. **Instagram Business or Creator Account**
   - Convert your personal Instagram to Business/Creator account
   - Link it to a Facebook Page

2. **Facebook Developer Account**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create an account if you don't have one

## Step-by-Step Setup

### 1. Create Facebook App

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps)
2. Click "Create App"
3. Choose "Business" type
4. Fill in app details:
   - App Name: "GoatBot Instagram"
   - Contact Email: your email
5. Click "Create App"

### 2. Add Instagram Product

1. In your app dashboard, click "Add Product"
2. Find "Instagram" and click "Set Up"
3. Click "Instagram Messaging" → "Set Up"

### 3. Get Access Token

1. Go to Tools → Graph API Explorer
2. Select your app from dropdown
3. Add permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_messaging`
   - `pages_read_engagement`
4. Click "Generate Access Token"
5. **Copy this token** - you'll need it!

### 4. Get Instagram Page ID

1. In Graph API Explorer, enter: `me?fields=instagram_business_account`
2. Click "Submit"
3. Copy the `instagram_business_account.id` value

### 5. Configure Webhook

1. Go to your app → Products → Webhooks
2. Choose "Instagram" from dropdown
3. Click "Subscribe to Instagram Updates"
4. Enter callback URL: `https://your-replit-url.repl.co/webhook`
5. Enter verify token: `goatbot_ig_verify` (or your custom token)
6. Subscribe to fields:
   - `messages`
   - `messaging_postbacks`
   - `message_reactions`

### 6. Configure Environment Variables

Create a `.env` file or use Replit Secrets:

```env
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_PAGE_ID=your_instagram_page_id_here
INSTAGRAM_VERIFY_TOKEN=goatbot_ig_verify
PORT=5000
```

### 7. Start the Bot

```bash
npm install
npm start
```

## Testing

1. Send a DM to your Instagram account
2. Check bot console for incoming message logs
3. Bot should respond based on commands

## Important Notes

- ✅ **Works**: Direct messages (1-on-1)
- ❌ **Doesn't work**: Instagram group chats (not supported by API)
- ⚠️ **Rate Limits**: Instagram has stricter rate limits than Messenger
- 🔄 **Token Expiry**: Access tokens may expire, use long-lived tokens

## Troubleshooting

### "Invalid access token"
- Regenerate token with correct permissions
- Ensure app is not in development mode restrictions

### "Webhook not receiving messages"
- Check webhook is subscribed to correct fields
- Verify callback URL is accessible (use https)
- Check verify token matches

### "Cannot send messages"
- User must message bot first (can't initiate conversations)
- Check `instagram_manage_messages` permission is granted

## Getting Long-Lived Token

```bash
curl -i -X GET "https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_TOKEN"
```

## Support

For issues, check:
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api/guides/messaging)
- [GoatBot GitHub Issues](https://github.com/Team-Calyx/GoatBot-V2/issues)
# Instagram GoatBot V2 Setup Guide

## Prerequisites

1. Facebook Developer Account
2. Instagram Business Account
3. Facebook Page connected to Instagram Business Account

## Setup Steps

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Business type)
3. Add "Instagram" product to your app

### 2. Get Access Token

1. Go to Graph API Explorer
2. Select your app
3. Request these permissions:
   - `instagram_basic`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_messaging`
4. Generate Access Token
5. Use Access Token Debugger to check token validity
6. Optionally exchange for long-lived token (60 days)

### 3. Get Instagram User ID (Page ID)

Run this in Graph API Explorer:
```
GET /me/accounts
```

Then for each page:
```
GET /{page-id}?fields=instagram_business_account
```

The `instagram_business_account.id` is your Instagram User ID.

### 4. Configure account.txt

```json
[
  {
    "accessToken": "YOUR_LONG_LIVED_ACCESS_TOKEN",
    "igUserID": "YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "pageID": "YOUR_INSTAGRAM_BUSINESS_ACCOUNT_ID",
    "verifyToken": "goatbot_verify_token_12345"
  }
]
```

### 5. Setup Webhook (Replit)

1. Your webhook URL: `https://YOUR-REPL-NAME.YOUR-USERNAME.repl.co/webhook`
2. Go to Facebook App Dashboard > Instagram > Configuration
3. Add webhook callback URL
4. Verify token: Use the same token from account.txt
5. Subscribe to: `messages`, `messaging_postbacks`

### 6. Environment Variables (Optional)

Instead of account.txt, you can use Replit Secrets:

- `INSTAGRAM_ACCESS_TOKEN` or `IG_ACCESS_TOKEN`
- `INSTAGRAM_PAGE_ID` or `IG_USER_ID`
- `INSTAGRAM_VERIFY_TOKEN` or `IG_VERIFY_TOKEN`

### 7. Start the Bot

Click the "Run" button in Replit or:
```bash
npm install
node index.js
```

### 8. Verify Webhook

In Facebook App Dashboard, use "Test" button to verify webhook is receiving events.

## Troubleshooting

### Token Expired
- Tokens expire after 60 days
- Generate new long-lived token
- Update account.txt or environment variables

### Webhook Not Receiving Messages
- Check webhook subscription in Facebook App Dashboard
- Verify URL is accessible: `https://YOUR-REPL-URL.repl.co/webhook`
- Check verify token matches
- Ensure Repl is running (keep-alive)

### API Errors
- Check token permissions
- Verify Instagram Business Account is linked to Facebook Page
- Check Graph API version compatibility

## Features Supported

✅ Send/Receive Messages
✅ Message Reactions
✅ Typing Indicators
✅ Read Receipts
✅ Commands System
✅ Event Handlers
✅ Dashboard (if enabled)
✅ Multi-account Support

## Features Not Supported (Instagram Limitations)

❌ Thread Color Changes
❌ Thread Emoji Changes
❌ Nickname Changes
❌ Group Chat Creation
❌ Add/Remove Users

## Notes

- Instagram Graph API has rate limits
- Messages work in Instagram Direct (1-on-1 and group DMs)
- Not all Facebook Messenger features are available on Instagram
