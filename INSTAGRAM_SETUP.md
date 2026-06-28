# INSTAGRAM_SETUP.md

## 🍪 Instagram Cookie Setup (Detailed)

GoatBot-IG uses your browser cookies to authenticate with Instagram. This is safer than email/password login and bypasses most security checks.

### 1. Install Cookie-Editor
- [Chrome Extension](https://chrome.google.com/webstore/detail/cookie-editor/hlkenndednhfkekhgcdicdfddnkalmdm)
- [Firefox Add-on](https://addons.mozilla.org/en-US/firefox/addon/cookie-editor/)

### 2. Export Cookies
1. Log in to [Instagram](https://www.instagram.com) on your computer.
2. Click the **Cookie-Editor** icon in your extension bar.
3. Click the **Export** button at the bottom.
4. Select **Netscape** format (Required!).
5. The cookies will be copied to your clipboard.

### 3. Add to Bot
1. Create a file named `account.txt` in the root folder of the bot.
2. Paste the copied cookies into this file.
3. Save and close.

---

## 🛡️ Anti-Ban Best Practices

Using a bot on Instagram carries risks. Follow these guidelines to keep your account safe:

### 1. Use Natural Delays
The bot is now equipped with `humanDelay`. It introduces a random delay (default 500ms - 2000ms) before responding.
- **Config:** `humanDelay` in `config/default.json`.

### 2. Enable Realism Features
- **Typing Indicators:** `typingIndicator` is enabled by default. It makes the bot look like it's typing before sending a message.
- **Read Receipts:** The bot can automatically mark messages as seen.

### 3. Avoid Spamming
- Don't run the bot 24/7 on a new account.
- Limit the number of groups the bot is in.
- Use the built-in `spamProtection` to auto-ban users who abuse commands.

### 4. Dedicated Account
**Strongly Recommended:** Use a dedicated Instagram account for the bot, not your personal one.

---

## ⚙️ New Logging Features

The logging system has been upgraded to a production-grade winston setup:
- **Colored Console:** Easy to read logs with timestamps and levels.
- **Daily Rotation:** Logs are saved in `./logs/` and rotated daily.
- **Structured JSON:** Logs are saved as JSON for easy parsing.
- **Discord Webhook:** (Optional) Forward logs to a Discord channel.
  - Set `logging.webhookUrl` in `config/default.json`.

---

## 🤖 AI Fallback

If a user sends a message starting with the prefix that doesn't match any command, the bot can forward it to an AI command (like `gpt`).
- **Enable:** Set `AI_FALLBACK.enable` to `true` in `config/default.json`.
- **Command:** Set `AI_FALLBACK.command` to the name of your AI command (e.g., `"gpt"`).
