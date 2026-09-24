# 🚀 AegisMod — Wispbyte Hosting & Deployment Guide

This guide details how to host and run **AegisMod** on **Wispbyte** (Pterodactyl-based Game/Discord Bot Hosting) with 24/7 uptime.

---

## 1. Discord Developer Portal Setup

Before launching on Wispbyte, configure your bot credentials and privileged intents:

1. Visit [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**.
2. Name your bot (e.g., `AegisMod`).
3. Navigate to the **Bot** tab on the left:
   - Click **Reset Token** and copy your **Bot Token** (keep this secret!).
   - Scroll down to **Privileged Gateway Intents** and enable:
     - ✅ **Presence Intent** (optional)
     - ✅ **Server Members Intent** (Required for hierarchy checks and timeouts)
     - ✅ **Message Content Intent** (Required for reading chat messages to moderate)
4. Navigate to the **OAuth2 -> URL Generator** tab:
   - Check `bot` and `applications.commands`.
   - Under **Bot Permissions**, select:
     - `Administrator` OR at minimum:
     - `Manage Roles`
     - `Manage Channels`
     - `Kick Members`
     - `Ban Members`
     - `Moderate Members` (Timeout)
     - `View Audit Log`
     - `Read Messages/View Channels`
     - `Send Messages`
     - `Manage Messages`
     - `Embed Links`
     - `Read Message History`
5. Copy the generated invite link and invite the bot to your teenage community server!

---

## 2. Wispbyte Server Setup

Wispbyte uses standard Pterodactyl panels for hosting Discord bots.

### Step A: Create or Select Your Bot Server
1. In your **Wispbyte Client Dashboard**, deploy a new server with the **Node.js** egg (Select **Node.js 20** or **Node.js 22**).
2. 512 MB RAM and 0.5 vCPU is more than enough for AegisMod thanks to the lightweight Triage filter.

### Step B: Upload Files
1. In the Wispbyte Control Panel, click on **Files**.
2. Click **Upload** and upload the project files (or upload `aegismod-bot.zip` and click **Unarchive**).
3. Ensure the structure inside `/home/container` looks like:
   ```
   /home/container/
   ├── package.json
   ├── tsconfig.json
   ├── .env
   └── src/
       ├── index.ts
       ├── commands/
       │   ├── setup.ts
       │   └── moderation.ts
       ├── config/
       │   └── safetyRubric.ts
       ├── events/
       │   ├── messageCreate.ts
       │   ├── messageUpdate.ts
       │   └── messageDelete.ts
       └── services/
           ├── geminiModerationService.ts
           ├── loggingService.ts
           ├── roleService.ts
           ├── traditionalModService.ts
           └── triageService.ts
   ```

### Step C: Configure Environment Variables
Create a file named `.env` in the root directory (or configure via the **Startup** panel):
```env
DISCORD_BOT_TOKEN="your_discord_bot_token_here"
DISCORD_CLIENT_ID="your_discord_application_client_id_here"
GEMINI_API_KEY="your_google_gemini_api_key_here"
NODE_ENV="production"
```

### Step D: Configure Startup Command
In the **Startup** tab:
- **Recommended Standard Startup Command**:
  ```bash
  if [ -d /home/container/.git ]; then echo "🔄 Pulling updates..."; git fetch origin main && git reset --hard origin/main; else echo "📦 Cloning..."; git clone --depth 1 -b main https://github.com/sennexed/Aegis-bot.git /home/container; fi; npm install --no-audit --no-fund; echo "🚀 Starting AegisMod..."; npm start
  ```
- Or simple direct run if you already have the repository cloned:
  ```bash
  npm install && npm start
  ```

### Step E: Start Your Server
1. Go to the **Console** tab in Wispbyte.
2. Click **Start**.
3. Watch the console output. You should see:
   ```
   [Pterodactyl] Starting container...
   Registering global slash commands with Discord API...
   ✅ Successfully registered slash commands (/setup, /ban, /kick, /mute, /warn, /cases).
   🛡️ AegisMod is online! Logged in as AegisMod#1234
   ```

---

## 3. In-Discord Onboarding

Once AegisMod is online in your Discord server:

1. Type `/setup` in any administrator channel.
2. Use the interactive **Role Select Menus**:
   - Select your **Owner Role**
   - Select your **Admin Role(s)**
   - Select your **Moderator Role(s)**
3. The bot will automatically create and lock the `#mod-logs` channel.
4. Try typing a test message:
   - Benign gaming chat: `ggwp nice shot` -> Evaluated in 0ms (0 tokens).
   - Flagged violation -> Automatically deleted or timed out with a rich record logged in `#mod-logs`.
