<div align="center">

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!--           ANIME HEADER — famous anime girls              -->
<!-- ╚══════════════════════════════════════════════════════╝ -->

<img src="https://user-images.githubusercontent.com/74038190/213910845-af37a709-8995-40d6-be59-724526e3c3d7.gif" width="140" alt="Anime Girl 1"/>
<img src="https://user-images.githubusercontent.com/74038190/229223263-cf2e4b07-2615-4f87-9c38-e37600f8381a.gif" width="200" alt="Zero Two — Darling in the FranXX"/>
<img src="https://user-images.githubusercontent.com/74038190/226127923-0e8b7792-7b3c-462b-951b-63c96ba1a5af.gif" width="200" alt="Anime Girl 3"/>
<img src="https://user-images.githubusercontent.com/74038190/212749447-bfb7e725-6987-49d9-ae85-2015e3e7cc41.gif" width="140" alt="Anime Coder Girl"/>

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

>  *A powerful Instagram Direct Message bot with a live web dashboard — built for speed, style, and extensibility. Enhanced with production-grade logging and anti-ban best practices.*

</div>

---

##  Table of Contents

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
| 📜 **Production Logging** | Winston-powered structured JSON logs, daily rotation, and webhook support |
| 🕵️ **Anti-Ban** | Randomized human-like delays, typing indicators, and auto-read receipts |
| 🤖 **AI Fallback** | Automatically routes unknown commands to AI (e.g., GPT) |
| 🔄 **Auto-Reconnect** | Intelligent exponential backoff and watchdog for 24/7 stability |
| 🛡️ **Spam Protection** | Auto-bans spammers with configurable thresholds |
| 🐐 **GoatV2 Core** | Fully ported core system and lifecycle support |
| 💳 **Advanced Bank** | Complete banking system with ATM cards |
| 📈 **Rank System** | Experience and level system with rank cards |

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

- **Node.js** v18 or v20 (v20 recommended)
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

The bot will:
1. Read cookies from `account.txt`
2. Login to Instagram via MQTT
3. Load all 21 commands and 7 events
4. Start the live dashboard at **http://localhost:3000**
5. Begin listening for messages in real time ✅

---

## 🍪 account.txt — Cookie Setup

This file holds your Instagram session cookies in **Netscape format**.  
This is the same format used by browsers — no manual formatting needed if you use a cookie exporter extension.

### 📄 File Location
```
account.txt   ← root of the project
```

### 📋 Format (Netscape Cookie Format)

```
# Netscape HTTP Cookie File
# This is the cookie file — paste your Instagram cookies below
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      ps_n    1
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      datr    XXXXXXXXXXXXXXXXXXXXXXXX
.instagram.com  TRUE    /       TRUE    1999999999      ds_user_id      YOUR_USER_ID_HERE
.instagram.com  TRUE    /       TRUE    1999999999      csrftoken       YOUR_CSRF_TOKEN_HERE
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      ig_did  XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
#HttpOnly_.instagram.com        TRUE    /       TRUE    1999999999      sessionid       YOUR_USER_ID%3AYOUR_SESSION_TOKEN
.instagram.com  TRUE    /       TRUE    1999999999      mid     XXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🛡️ Anti-Ban & Best Practices

To reduce the risk of account bans, GoatBot-IG includes several built-in protection layers:

- **Human-like Delays:** Random delays (configurable) before responding to simulate human typing.
- **Typing Indicators:** Simulates the "Typing..." state before sending messages.
- **Auto-Read Receipts:** Optionally marks messages as read automatically.
- **Backoff Logic:** Built-in exponential backoff for API requests when rate limits are hit.
- **Message Cleaning:** Normalizes message content to avoid bot-like repetitive patterns.

*Configure these in `config/default.json` under `humanDelay`, `typingIndicator`, and `optionsFca`.*

---

## ⚙️ Configuration

Edit **`config/default.json`**:

```jsonc
{
  "prefix": "!",                    // Command prefix
  "noPrefix": true,                 // Allow no-prefix commands
  "nickNameBot": "GoatBot-IG",      // Bot display name

  "adminBot": ["YOUR_UID_HERE"],    // Bot admin UIDs
  "premiumUsers": [],               // Premium user UIDs
  "devUsers": ["YOUR_UID_HERE"],    // Developer UIDs

  "humanDelay": {
    "enable": true,                 // Enable natural delays
    "min": 1500,                    // Min delay (ms)
    "max": 4000                     // Max delay (ms)
  },

  "AI_FALLBACK": {
    "enable": false,                // Route unknown commands to AI
    "command": "gpt"                // Target AI command
  },

  "logging": {
    "logLevel": "info",             // info, debug, warn, error, success
    "logToFile": true,              // Save logs to /logs directory
    "webhookUrl": ""                // Optional Discord/Slack webhook
  }
}
```

---

## 📊 Dashboard

GoatBot-IG includes a **live web dashboard** accessible from any browser.

### 🌐 Access
```
http://localhost:3000
```

### 📑 Dashboard Pages
- **Overview:** Live status, uptime, and recent activity.
- **Groups:** Search and manage your Instagram chats.
- **Users:** Monitor user activity, balances, and ban status.
- **Commands:** Browse all loaded commands and their requirements.
- **Logs:** Real-time log viewer with filtering capabilities.

---

## 💖 Credits

<div align="center">

| Role | Person / Project |
|------|-----------------|
| **Bot Architecture** | [Gtajisan](https://github.com/Gtajisan) |
| **Original GoatBot V2** | [NTKhang](https://github.com/ntkhang03) |
| **Logging & Best Practices** | Inspired by [insta-p8](https://github.com/ayuuxh2/insta-p8) |
| **Instagram MQTT Library** | [@neoaz07/nkxica](https://www.npmjs.com/package/@neoaz07/nkxica) |

</div>

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:db2777,100:7c3aed&height=120&section=footer" width="100%"/>

**Made with 💜 by [Gtajisan](https://github.com/Gtajisan)**

*If you found this useful, please ⭐ star the repo!*

[![GitHub stars](https://img.shields.io/github/stars/Gtajisan/GoatBot-IG-Port?style=social)](https://github.com/Gtajisan/GoatBot-IG-Port/stargazers)

</div>
