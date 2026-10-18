# Feature 13: Zero-Config Setup Wizard & Canonical Disk Persistence

## 1. Overview & Purpose
A persistent failure in self-hosted Discord bots is configuration amnesia: when the host restarts, containers redeploy, or working directories shift, bot channel IDs and moderator roles are forgotten, breaking AutoMod.
AegisMod solves this with:
1. **Interactive Setup Wizard (`setup.ts`):** Automatically creates `#mod-logs`, binds moderator roles, and configures channel overrides with one slash command.
2. **Canonical Persistent Storage Engine (`storagePath.ts`, `guildMemoryService.ts`):** Guarantees file paths resolve to a single persistent storage directory regardless of execution context.

---

## 2. Interactive Setup Wizard (`/setup`)

When invited to a server, running `/setup` executes an end-to-end setup routine:

```
Administrator executes /setup
             │
             ▼
[1. Staff Role Binding]
  • Detects existing Admin & Mod roles or prompts RoleSelectMenu.
  • Binds Moderator role IDs to roleService memory.
             │
             ▼
[2. #mod-logs Channel Creation]
  • Searches for existing #mod-logs text channel.
  • If absent, creates #mod-logs with strict private permissions:
    - @everyone: View Channel ❌ DENY
    - @Staff: View Channel ✅ ALLOW
             │
             ▼
[3. Server Memory Record Creation]
  • Writes server record to guildMemoryService:
    - Guild Name, ID, Owner ID
    - Joined Timestamp & Initial Setup Status: COMPLETE
             │
             ▼
[4. Global Moderation Commands Unlock]
  • Activates full suite (/ban, /kick, /warn, /news, /namestyle, /duty).
  • Dispatches Welcome & Status Embed to #mod-logs.
```

---

## 3. Canonical Storage Path Resolver (`storagePath.ts`)

### Root Path Normalization
```typescript
export function getPersistentDataDir(): string {
  // Checks environment override, Docker mount, or workspace root /data
  const primaryDataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(primaryDataDir)) {
    fs.mkdirSync(primaryDataDir, { recursive: true });
  }
  return primaryDataDir;
}
```

### Managed Persistent Files:
- `data/guild_memory.json` — Guild registration and setup states.
- `data/guild_roles.json` — Moderator, admin, and staff role mappings.
- `data/log_channels.json` — Bound `#mod-logs` channel IDs per server.
- `data/auto_news_config.json` — Newspaper schedule timers and channels.
- `data/channel_policies.json` — Per-channel safety profiles.
- `data/central_blacklist.json` — Custom server vocabulary additions.
- `data/verification_config.json` — Verification gatekeeper parameters.
