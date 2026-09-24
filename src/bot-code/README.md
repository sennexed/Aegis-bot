# AegisMod - Discord Hybrid AI Moderation Bot

A production-ready Discord hybrid moderation bot combining Google Gemini 3.8 Flash with a deterministic server-side Policy Engine and traditional slash commands (`/setup`, `/ban`, `/kick`, `/mute`, `/warn`, `/cases`). Engineered specifically for teen communities (ages ~16) with zero tolerance for predatory grooming, cyberbullying, doxxing, self-harm, and hate speech.

---

## Architecture Overview

```
User Message / Edit Event
          │
          ▼
┌──────────────────────────┐
│  Tier 1 & Tier 2 Triage  │ ──(Benign / Cache / Zero-Tolerance Regex)──┐
└──────────────────────────┘                                            │
          │ (Contextual required)                                       │
          ▼                                                             │
┌──────────────────────────┐                                            │
│   Gemini 3.8 Flash AI    │                                            │
│ (Structured JSON Schema) │                                            │
└──────────────────────────┘                                            │
          │                                                             │
          ▼                                                             │
┌──────────────────────────────────────────────────────────┐            │
│                 Deterministic Policy Engine               │ ◄──────────┘
│ - Validates and sanitizes untrusted classifications     │
│ - Enforces strict teen safety escalation matrix          │
│ - Never allows AI text to execute arbitrary commands     │
└──────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────┐
│                     Discord Action                       │
│ - Execution (Delete / Warn / Timeout / Ban)              │
│ - User DM notification with supportive guidance          │
│ - Rich Embed in dedicated #mod-logs                      │
│ - Critical staff ping for predatory grooming / self-harm │
└──────────────────────────────────────────────────────────┘
```

---

## Setup & Command Visibility

### Setup-First Security Model
To maintain strict permission hygiene, **all moderation commands remain hidden** when the bot joins a server. Only `/setup` is available to administrators.

1. An administrator runs `/setup`.
2. The interactive Discord Role Select wizard appears, prompting configuration of:
   - **Owner / Executive Role**: Full bypass and override.
   - **Administrator Roles**: Can run `/setup`, `/cases`, and manage bot settings.
   - **Moderator Roles**: Can execute `/ban`, `/kick`, `/mute`, `/warn`, and access `#mod-logs`.
3. The bot automatically creates or binds the dedicated `#mod-logs` channel with strict permission overwrites (denying `@everyone`, permitting staff roles).
4. Moderation commands (`/ban`, `/kick`, `/mute`, `/warn`, `/cases`) are dynamically registered and unlocked for the server.

---

## Environment Variables

Copy `.env.example` to `.env`:

```bash
# Gemini API Key (Required for AI moderation)
GEMINI_API_KEY="your_gemini_api_key_here"

# Discord Bot Credentials
DISCORD_BOT_TOKEN="your_discord_bot_token_here"
DISCORD_CLIENT_ID="your_discord_client_id_here"

# Moderation Profile
MODERATION_POLICY_LEVEL="STRICT_TEEN"
PORT=10734
SUBDOMAIN="aegis-bot.wispbyte.app"
WEBPAGE_URL="https://aegis-bot.wispbyte.app/"
```

### Discord Developer Portal Configuration
Ensure the following **Privileged Gateway Intents** are toggled ON in your Discord Developer Portal:
1. `Message Content Intent` (Required to inspect message content for moderation)
2. `Server Members Intent` (Required to check role hierarchies and permissions)

---

## Installation & Running

### Running the Bot Standalone
```bash
cd src/bot-code
npm install
npm run build
npm start
```

### Running in Development Mode
```bash
cd src/bot-code
npm run dev
```

### Running the Automated Test Suite
```bash
cd src/bot-code
npm test
```

---

## Testing & Verification

The bot includes an automated test suite in `tests/moderation.test.ts` verifying:
- Tier-1 benign slang fast filters (0 tokens consumed for casual gaming chat)
- Tier-2 local zero-tolerance regex catches (immediate action for severe keywords)
- Deterministic escalation matrix in `PolicyEngine` (Grooming $\rightarrow$ Immediate Ban; Self-Harm $\rightarrow$ 24h Timeout + Crisis hotline guidance + Staff ping; Hate Speech $\rightarrow$ 1h Timeout)
- Prompt injection and jailbreak neutralization
- Untrusted AI classification validation and sanitization

---

## Deployment on Wispbyte or Cloud Containers

### Deploying on Wispbyte
Configure the **Startup Command** in your Wispbyte Pterodactyl container:
```bash
if [ -d /home/container/.git ]; then echo "🔄 Pulling repository updates..."; git fetch origin main && git reset --hard origin/main; else echo "📦 Cloning repository..."; git clone --depth 1 -b main https://github.com/sennexed/Aegis-bot.git /home/container; fi; if ! node -e "require('discord.js')" >/dev/null 2>&1; then echo "📥 Repairing & installing dependencies..."; rm -rf node_modules package-lock.json /tmp/npm-cache ~/.npm 2>/dev/null; npm install --no-progress --no-audit --no-fund; fi; echo "🚀 Starting server..."; npm start
```

Refer to `WISPBYTE_DEPLOYMENT.md` in this directory for comprehensive step-by-step instructions on deploying AegisMod on Wispbyte, Pterodactyl, Docker, or Cloud Run.
