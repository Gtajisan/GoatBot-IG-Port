<div align="center">

<!-- ╔══════════════════════════════════════════════════════╗ -->
<!--           ANIME HEADER — famous anime girls              -->
<!-- ╚══════════════════════════════════════════════════════╝ -->

<img src="https://user-images.githubusercontent.com/74038190/213910845-af37a709-8995-40d6-be59-724526e3c3d7.gif" width="140" alt="Anime Girl 1"/>
<img src="https://user-images.githubusercontent.com/74038190/229223263-cf2e4b07-2615-4f87-9c38-e37600f8381a.gif" width="200" alt="Zero Two — Darling in the FranXX"/>
<img src="https://user-images.githubusercontent.com/74038190/226127923-0e8b7792-7b3c-462b-951b-63c96ba1a5af.gif" width="200" alt="Anime Girl 3"/>
<img src="https://user-images.githubusercontent.com/74038190/212749447-bfb7e725-6987-49d9-ae85-2015e3e7cc41.gif" width="140" alt="Anime Coder Girl"/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:7c3aed,100:db2777&height=200&section=header&text=GoatBot-IG&fontSize=70&fontColor=ffffff&animation=twinkling&fontAlignY=38&desc=Professional%20Instagram%20Bot%20%7C%20Production%20Grade&descAlignY=60&descSize=18" width="100%"/>

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Instagram](https://img.shields.io/badge/Instagram-DM%20Bot-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com)
[![MQTT](https://img.shields.io/badge/MQTT-Real%20Time-660066?style=for-the-badge&logo=mqtt&logoColor=white)](https://mqtt.org)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.1.0-ff69b4?style=for-the-badge)]()
[![Commands](https://img.shields.io/badge/Commands-21+-9b59b6?style=for-the-badge)]()
[![Dashboard](https://img.shields.io/badge/Dashboard-Live%20Web%20UI-00b4d8?style=for-the-badge)]()

<br/>

>  *A powerful Instagram Direct Message bot with a live web dashboard — built for speed, style, and production-grade reliability.*

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
| 🛡️ **Spam Protection** | Auto-bans spammers, configurable thresholds |
| 📜 **Robust Logging** | Winston-powered daily rotation, structured JSON, and Discord webhook support |
| 🕵️ **Advanced Anti-Ban** | Human-like delays, typing indicators, and auto-mark-read |
| 🤖 **AI Fallback** | Automatically routes unknown commands to AI (GPT) |
| 🐐 **GoatV2 Core** | Fully ported core system with production-grade error handling |
| 💳 **Advanced Bank** | Complete banking system with ATM cards |
| 📈 **Rank System** | Experience and level system with rank cards |

</div>

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
npm start
```

---

## ⚙️ Configuration

Edit **`config/default.json`**:

```jsonc
{
  "prefix": "!",                    // Command prefix
  "humanDelay": {
    "min": 1000,                    // Min human-like delay (ms)
    "max": 3000                     // Max human-like delay (ms)
  },
  "logging": {
    "logLevel": "info",             // debug, info, warn, error
    "logToFile": true,              // Save logs to files
    "webhookUrl": ""                // Optional Discord webhook for remote logs
  },
  "AI_FALLBACK": {
    "enable": false,                // Route unknown commands to AI
    "command": "gpt"                // AI command name
  },
  "typingIndicator": {
    "enable": true,                 // Simulate typing before sending
    "duration": 1500                // Duration of typing animation
  }
}
```

---

## 📊 Dashboard

Access the live dashboard at:
```
http://localhost:3000
```
- **Overview**: Live bot status and stats.
- **Groups/Users**: Manage your Instagram audience.
- **Commands**: Browse all loaded features.
- **Logs**: Real-time structured log viewer.

---

## 🕵️ Anti-Ban Features

GoatBot-IG-Port includes sophisticated anti-ban mechanisms inspired by industry best practices:

- **Natural Delays**: Randomized delays before any action.
- **Typing Indicators**: Simulates real user behavior before replying.
- **Auto-Mark Read**: Marks incoming messages as read automatically.
- **Rate-Limit Backoff**: Intelligent exponential backoff when hitting rate limits.
- **Unified Logging**: Every action is logged for audit and debugging.

---

## 💖 Credits

- **Bot Architecture**: [Gtajisan](https://github.com/Gtajisan)
- **Original GoatBot V2**: [NTKhang](https://github.com/ntkhang03)
- **Log System Inspiration**: [insta-p8](https://github.com/ayuuxh2/insta-p8)
- **Instagram MQTT Library**: [@neoaz07/nkxica](https://www.npmjs.com/package/@neoaz07/nkxica)

---

**Made with 💜 by [Gtajisan](https://github.com/Gtajisan)**
