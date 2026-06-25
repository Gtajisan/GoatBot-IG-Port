<div align="center">

<img src="https://user-images.githubusercontent.com/74038190/240906093-9be4d344-6782-461a-b5a6-32a07bf7b34e.gif" width="200" alt="Anime Girl"/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,100:db2777&height=200&section=header&text=GoatBot-IG&fontSize=70&fontColor=ffffff&animation=twinkling&fontAlignY=38&desc=Professional%20Instagram%20Bot%20%7C%20MQTT%20Powered&descAlignY=60&descSize=18" width="100%"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Instagram](https://img.shields.io/badge/Instagram-DM%20Bot-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com)
[![MQTT](https://img.shields.io/badge/MQTT-Real%20Time-660066?style=for-the-badge&logo=mqtt&logoColor=white)](https://mqtt.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.1.0-ff69b4?style=for-the-badge)]()
[![Commands](https://img.shields.io/badge/Commands-21+-9b59b6?style=for-the-badge)]()
[![Dashboard](https://img.shields.io/badge/Dashboard-Live%20Web%20UI-00b4d8?style=for-the-badge)]()

<br/>

> ✨ *A powerful Instagram Direct Message bot with a live web dashboard — built for speed, style, and extensibility.*

</div>

---

## 🌸 Table of Contents

- [✨ Features](#-features)
- [📸 Screenshots](#-screenshots)
- [📦 Requirements](#-requirements)
- [🚀 Installation](#-installation)
- [🍪 account.txt — Cookie Setup](#-accounttxt--cookie-setup)
- [⚙️ Configuration](#️-configuration)
- [🤖 Commands](#-commands)
- [📅 Events](#-events)
- [🗄️ Database](#️-database)
- [📊 Dashboard](#-dashboard)
- [🗂️ Project Structure](#️-project-structure)
- [🛠️ Adding Custom Commands](#️-adding-custom-commands)
- [🧩 Adding Custom Events](#-adding-custom-events)
- [🔐 Roles & Permissions](#-roles--permissions)
- [🛡️ Anti-Ban & Best Practices](#️-anti-ban--best-practices)
- [🌐 Deploying (Replit)](#-deploying-replit)
- [❓ FAQ & Troubleshooting](#-faq--troubleshooting)
- [💖 Credits](#-credits)

---

## ✨ Features

<div align="center">

| Feature | Description |
|:-------:|:------------|
| ⚡ **MQTT Real-Time** | Connects to Instagram via native MQTT — no polling, instant messages |
| 🎮 **21+ Commands** | Games, AI, utility, admin, moderation — all ready to go |
| 📊 **Live Dashboard** | Beautiful dark web UI — monitor bot stats, users, threads, logs in real time |
| 🍪 **Cookie Login** | Paste your Netscape cookies into `account.txt` and go |
| 🔐 **Role System** | 5-tier permission system — user → mod → admin → owner → dev |
| 🗄️ **JSON Database** | Zero-setup persistent storage — users, threads, economy |
| 🔔 **7 Event Handlers** | Welcome, leave, reactions, errors, ready — everything covered |
| 🔄 **Auto-Save** | Database auto-saves every minute — no data loss |
| 🌐 **Per-Thread Prefix** | Each group can have its own custom command prefix |
| 🤖 **AI Fallback** | Automatically use AI (gpt) when no command matches |
| 🛡️ **Anti-Ban** | Human-like delays, backoff logic, and typing indicators |
| 📝 **Winston Logging** | Daily rotating logs, colorized console, and structured JSON output |

</div>

---

## 📸 Screenshots

### 📊 Live Dashboard — Overview
<div align="center">
<img src="assets/screenshots/dashboard-overview.jpg" width="900" alt="Dashboard Overview"/>
</div>

### 🖥️ Dashboard Tabs
The dashboard has **5 live tabs** — all auto-refresh every 15 seconds:

| Tab | What It Shows |
|-----|--------------|
| **Overview** | Bot status, uptime, memory, commands loaded, recent activity |
| **Groups** | All Instagram chats — name, members, thread ID, view full member list |
| **Users** | All users in DB — messages, commands, balance, ban status |
| **Commands** | All loaded commands — category, role requirement, cooldown, aliases |
| **Logs** | Last 300 log lines — filterable by INFO / WARN / ERROR / DEBUG |

---

## 📦 Requirements

- **Node.js** v20 or higher
- **npm** or **pnpm**
- An **Instagram account** (cookies from browser)
- Internet connection

---

## 🚀 Installation

### 1️⃣ Clone the repository

```bash
git clone https://github.com/Gtajisan/GoatBot-IG-Port.git
cd GoatBot-IG-Port
```

### 2️⃣ Install dependencies

```bash
npm install
```

### 3️⃣ Add your Instagram cookies

See the **[🍪 Cookie Setup](#-accounttxt--cookie-setup)** section below.

### 4️⃣ Configure the bot

Edit `config/default.json` — set your admin UID, prefix, timezone, etc.
See **[⚙️ Configuration](#️-configuration)**.

### 5️⃣ Start the bot

```bash
node index.js
```

---

## 🍪 account.txt — Cookie Setup

This file holds your Instagram session cookies in **Netscape format**.  

### 📄 File Location
```
account.txt   ← root of the project
```

### 📋 Format (Netscape Cookie Format)

```
# Netscape HTTP Cookie File
# This is the cookie file — paste your Instagram cookies below
.instagram.com	TRUE	/	TRUE	1999999999	sessionid	YOUR_USER_ID%3AYOUR_SESSION_TOKEN
```

---

## ⚙️ Configuration

Edit **`config/default.json`**:

```jsonc
{
  "prefix": "!",                    // Command prefix
  "noPrefix": true,                 // Allow no-prefix commands
  "humanDelay": {
    "min": 500,                     // Min ms delay before replying
    "max": 2000                     // Max ms delay before replying
  },
  "aiFallback": {
    "enable": true,                 // Use AI if no command matches
    "command": "gpt"                // Command to trigger for fallback
  },
  "logging": {
    "logLevel": "info",             // info, debug, warn, error
    "logToFile": true,              // Save logs to storage/logs/
    "webhookUrl": ""                // Optional Discord/Slack webhook
  }
}
```

---

## 🛡️ Anti-Ban & Best Practices

This bot includes several features inspired by **insta-p8** to reduce ban risk:

1. **Natural Delays:** Bot waits between 500ms and 2000ms (configurable) before sending any message.
2. **Typing Indicators:** Simulates typing before replying.
3. **Rate-Limit Backoff:** Automatically waits and retries if Instagram sends a rate-limit error (429).
4. **Session Persistence:** Mimics a persistent mobile session by reusing cookies.

> ⚠️ **Warning:** Using unofficial APIs always carries a risk. Use a secondary account and do not spam.

---

## 📊 Dashboard

GoatBot-IG includes a **live web dashboard** accessible from any browser.

### 🌐 Access
```
http://localhost:3000
```

---

## 🛠️ Adding Custom Commands

Create a new file in `commands/` — e.g. `greet.js`:

```javascript
module.exports = {
  config: {
    name: "greet",
    description: "Greet someone",
    category: "fun",
    role: 0
  },

  async run({ api, event, args }) {
    await api.sendMessage(`👋 Hello!`, event.threadID);
  }
};
```

---

## 💖 Credits

<div align="center">

| Role | Person / Project |
|------|-----------------|
| **Bot Architecture** | [Gtajisan](https://github.com/Gtajisan) |
| **Original GoatBot V2** | [NTKhang](https://github.com/ntkhang03) |
| **Instagram MQTT Library** | [@neoaz07/nkxica](https://www.npmjs.com/package/@neoaz07/nkxica) |
| **Utils & Logging** | Inspired by [insta-p8](https://github.com/ayuuxh2/insta-p8) |

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:db2777,100:7c3aed&height=120&section=footer" width="100%"/>

**Made with 💜 by [Gtajisan](https://github.com/Gtajisan)**

</div>
