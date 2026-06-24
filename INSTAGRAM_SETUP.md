# Instagram Setup & Best Practices

Setting up a bot on Instagram requires caution to avoid account restrictions. This guide covers how to set up your account and maintain it safely.

## 1. Account Preparation

- **Account Age**: Use an account that is at least 1-2 weeks old. Brand-new accounts are flagged easily.
- **Profile**: Ensure your account has a profile picture, bio, and at least 3-5 posts.
- **Human Activity**: Manually use the account for a few days (liking, scrolling, messaging) before starting the bot.

## 2. Login Methods

### .env File (Recommended for Local/VPS)
Create a `.env` file in the root directory (you can copy `.env.example`) and add:
```
IG_USERNAME=your_username
IG_PASSWORD=your_password
```

### Username/Password (Legacy)
Add your credentials to `account.txt` in this format:
```
username=your_username
password=your_password
```

### Environment Variables (Replit/Cloud)
Set `IG_USERNAME` and `IG_PASSWORD` in your hosting environment's secrets.

## 3. Handling Checkpoints & 2FA

- **Checkpoint**: If you see "Checkpoint Required", log in to the Instagram app on your phone and click "It was me".
- **2FA**: We recommend using TOTP (authenticator app) if you enable 2FA. You can provide the code via the `IG_2FA_CODE` environment variable or enter it in the terminal during startup.

## 4. Anti-Ban Features in this Port

We have integrated several features inspired by `insta-p8` to protect your account:

- **Human-like Delays**: The bot waits a random time (500ms - 2000ms) before responding.
- **Typing Indicators**: The bot shows "typing..." status while waiting to reply.
- **Automatic Backoff**: If the bot hits a rate limit, it will automatically pause and retry after a delay.
- **Read Receipts**: The bot can automatically mark messages as read to simulate a real user.

## 5. Configuration for Safety

In `config.json`, you can tune these settings:

```json
"humanDelay": {
  "enable": true,
  "min": 500,
  "max": 2000,
  "typingIndicator": true
},
"optionsFca": {
  "autoMarkRead": true
}
```

## 6. Daily Monitoring

- **Check Logs**: Monitor the `./logs/` directory to see if there are any `error` or `rate limit` messages.
- **Stay Updated**: Keep the bot and its dependencies updated.

---
**Warning**: Using unofficial APIs is against Instagram's Terms of Service. This bot is for educational and personal use.
