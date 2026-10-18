# Feature 08: Phishing Interceptor & Anti-Raid Dynamic Gatekeeper

## 1. Overview & Purpose
Modern Discord attacks rely on two primary vectors:
1. **Deceptive Phishing Links:** Lookalike domains (e.g. `discrod-gift-nitro.ru`) designed to steal session tokens and Steam credentials.
2. **Coordinated Token Raids:** Dozens of automated accounts joining simultaneously within seconds to flood channels with abusive imagery and spam.

AegisMod pairs a deterministic **Phishing Permutation Engine** with a real-time **Anti-Raid Dynamic Gatekeeper**.

---

## 2. Phishing & Scam Domain Analyzer (`phishingFilter.ts`)

### Detection Algorithms
- **Levenshtein Distance & Permutations:** Identifies typosquatting on `discord.com`, `discord.gg`, `steamcommunity.com`, and `nitro` (e.g., `discrod`, `dlscord`, `discorcl`).
- **Suspicious TLD Screening:** Flags untrusted TLDs (`.ru`, `.xyz`, `.top`, `.tk`) pairing with gaming keywords (`free-nitro`, `airdrop`).
- **Whitelisted Media CDNs:** Explicit exemptions for legitimate media platforms (`tenor.com`, `giphy.com`, `media.discordapp.net`, `cdn.discordapp.com`).
- **Quote-It Formatting Safe Pass:** Allows Quote-It and Carl-bot codeblock message quotes without generating false positives.

---

## 3. Anti-Raid Emergency Gatekeeper (`antiRaidService.ts`)

```
User Joins Guild
       │
       ▼
[Join Velocity Sliding Window]
  • Tracks number of joins in past 12 seconds.
  • Joins > 10 in 12s?
       ├── NO  ──> Standard onboarding flow.
       └── YES ──> 🚨 MASS RAID DETECTED!
                     │
                     ▼
       [Automated Emergency Countermeasures]
         1. guild.setVerificationLevel(GuildVerificationLevel.High)
         2. Isolate & quarantine incoming accounts (<24h old)
         3. Ping on-duty staff (@here / @mod-duty)
         4. Lock public channel send permissions
```

### Slash Command: `/antiraid`
- `/antiraid status` — Shows current join rate, recent join history, and server verification level.
- `/antiraid lockdown action:ENABLE reason:"Mass bot spam"` — Manually elevates verification to High and locks newcomer channels.
- `/antiraid lockdown action:DISABLE` — Restores normal join rates and verification levels.
