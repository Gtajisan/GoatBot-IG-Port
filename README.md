# GoatBot-IG-Port

An Instagram port of GoatBot V2, maintaining the plug-and-play command/event system and global variable architecture. This port uses a private API layer for password and session-based login.

## Features
- **Faithful GoatBot V2 Architecture**: Exact same command format and event object shape.
- **Advanced Logging**: Winston-based logging with daily rotation, colored output, and structured JSON logs.
- **Anti-Ban Best Practices**: Random human-like delays, typing indicators, and automatic read receipts.
- **Robust Utilities**: Improved error handling with exponential backoff for rate limits.
- **Dashboard Support**: Built-in health server and web dashboard for status monitoring.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your credentials in `config/default.json` or `.env`.
4. Start the bot:
   ```bash
   npm start
   ```

## Configuration

Settings can be managed in `config/default.json`:
- `humanDelay`: Random delay range before sending messages.
- `typingIndicator`: Duration of typing simulation.
- `logging`: Log levels, file persistence, and optional Discord webhooks.

## Credits
- Based on GoatBot V2 by Gtajisan.
- Inspired by `insta-p8` for best practices in logging and utilities.
