# Instagram Setup Guide

## Credentials Setup

You can provide your Instagram credentials in two ways:

1. **Email & Password**: Enter your email and password in `config/default.json` or as environment variables (`IG_EMAIL`, `IG_PASSWORD`).
2. **Cookies (Session)**: Export your Instagram cookies and save them as a JSON string or in Netscape format in `account.txt`. The bot automatically persists session state to this file after a successful login.

## Best Practices for Anti-Ban

- **Human-like Delays**: The bot introduces random delays (`humanDelay` in config) before responding to simulate human behavior.
- **Typing Indicators**: Enables typing animation before sending messages.
- **Read Receipts**: Automatically marks messages as seen to appear more realistic.
- **Backoff Strategy**: The bot implements exponential backoff when hitting rate limits or "spam" errors from Instagram.

## Troubleshooting

- **Login Required**: If you see this error, your session has expired. Re-login with email/password or update your cookies.
- **Rate Limits**: If the bot is hitting rate limits frequently, increase the `min` and `max` values in `humanDelay`.
- **Private API**: Be aware that using unofficial APIs carries a risk of account suspension. Use a burner account for testing.
