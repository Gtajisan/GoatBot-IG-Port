# Instagram Setup & Best Practices

## 🍪 Cookie Authentication

GoatBot-IG-Port uses **Netscape HTTP Cookie format** for session persistence.

1. Install **Cookie-Editor** (Chrome/Firefox).
2. Log in to your Instagram bot account.
3. Click **Export** → **Netscape**.
4. Paste the content into `account.txt` in the root directory.

## 🛡️ Anti-Ban Best Practices

To keep your account safe, we've implemented several "Human Behavior" features:

### 1. Natural Delays (`humanDelay`)
The bot introduces a random delay before executing commands or replying. This prevents "bot-like" rapid-fire responses.
- **Recommendation**: Set `min` to at least 1000ms and `max` to 3000ms.

### 2. Typing Indicators (`typingIndicator`)
Simulates the "..." typing animation before the bot sends a message.
- **Enable**: Set `typingIndicator.enable` to `true` in config.

### 3. Automatic Read Receipts
The bot can automatically mark messages as read to appear more active.
- **Enable**: Set `optionsFca.autoMarkRead` to `true`.

### 4. Exponential Backoff
If the bot hits a rate limit (429 Error) or a spam block, it will automatically pause and retry with increasing intervals.

## 📜 Logging & Auditing

All bot activity is logged using **Winston**.
- **Console**: Beautifully colored logs for development.
- **Files**: Daily rotating logs in `logs/` folder.
- **Remote**: Optional Discord Webhook for critical errors and warnings.

## 📊 Monitoring

Use the **Live Dashboard** at `http://localhost:3000` to monitor:
- **Thread activity**
- **User engagement**
- **System logs in real-time**

## ❓ FAQ

**Q: My bot got "CHECKPOINT_REQUIRED"**
A: Log in to Instagram on your browser, complete the verification, and re-export fresh cookies to `account.txt`.

**Q: Can I use multiple accounts?**
A: One bot instance per account. Run multiple processes on different ports for multiple accounts.
