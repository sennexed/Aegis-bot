# AegisMod Verification System: Complete Architectural Specification

## Executive Summary
The **Verification Gatekeeper** is AegisMod's front-line defense mechanism engineered for adolescent (~16 y/o) Discord communities. It safeguards servers from token raid bots, automated spammers, banned user alts, and malicious accounts while maintaining an inviting, fast, and accessible onboarding experience for legitimate teenagers.

---

## 1. Lifecycle State Machine & Flow

```
                      ┌──────────────────────────────────────┐
                      │          New Member Joins            │
                      │       (guildMemberAdd Event)         │
                      └──────────────────┬───────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │    Anti-Raid & Quarantine Checks     │
                      │  • Account Age < Minimum? (e.g. 7d)  │
                      │  • Mass Join Velocity Spike?         │
                      │  • Default Avatar / Suspicious Tag?  │
                      └──────────────┬────────────────┬──────┘
                                     │                │
                        Passed Checks│                │ Failed / Flagged
                                     ▼                ▼
┌───────────────────────────────────────────┐  ┌───────────────────────────────────────────┐
│           Assign @Unverified Role         │  │         Assign @Quarantined Role          │
│ • Visible channel: #verification only     │  │ • Visible channel: #quarantine-help only  │
│ • All other text/voice channels hidden    │  │ • Direct ModMail button to contact staff  │
└─────────────────────┬─────────────────────┘  │ • Alert sent to #mod-logs / staff         │
                      │                        └───────────────────────────────────────────┘
                      ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                             Verification Gateway Method                                  │
├──────────────────────────┬───────────────────────────┬───────────────────────────────────┤
│ Tier 1: One-Click Button │ Tier 2: Algorithmic Captcha│ Tier 3: Gemini AI Safety Pledge  │
│ • Rules acknowledgment   │ • 6-character code modal  │ • Teen community conduct check   │
│ • Instant pass           │ • Anti-bot timer & limits │ • Validated in <300ms by Flash   │
└──────────────────────────┴─────────────┬─────────────┴───────────────────────────────────┘
                                         │
                                         ▼
                      ┌──────────────────────────────────────┐
                      │         Verification Complete        │
                      │  • Remove @Unverified role           │
                      │  • Grant @Verified Member role       │
                      │  • Unlock community channels         │
                      │  • Dispatch rich embed to #mod-logs  │
                      │  • Increment User Passport trust     │
                      └──────────────────────────────────────┘
```

---

## 2. Multi-Tier Verification Modes

| Mode | Target Threat | User Experience | Bot Overhead |
| :--- | :--- | :--- | :--- |
| **1. One-Click Agreement (`BUTTON`)** | Casual trolls, accidental joiners | User clicks **"✅ Verify & Accept Rules"** on a pinned embed. | 0 tokens, instant response (<50ms). |
| **2. Interactive Captcha (`CAPTCHA`)** | Automated spam bots, token raids | Clicking verify pops a Discord Modal requiring the user to type a randomized 6-character alphanumeric code or simple math puzzle. 3 attempts allowed within 60s. | 0 tokens, deterministic in-memory session. |
| **3. Account Maturity Gate (`ANTI_ALT`)** | Alt accounts, ban evaders, burner profiles | Automatically verifies accounts older than X days (e.g. 7 days) with a profile picture. Newer accounts are routed to manual staff review or Captcha. | 0 tokens, uses Discord `user.createdAt`. |
| **4. Gemini AI Safety Pledge (`AI_PLEDGE`)** | Malicious users seeking predatory contact | Modal prompts user with situational safety questions (e.g. *"What should you do if someone in DMs asks for your personal address or phone number?"*). Evaluated by Gemini 2.5 Flash Lite in <300ms. | Minimal tokens (~150 input tokens). |

---

## 3. Discord Permission & Role Hierarchy Matrix

To guarantee unverified users cannot read or speak in community channels, the permissions follow a strict deny-first layout:

```
@everyone
  ├── View Channel: ❌ DENY (Default across all community categories)
  └── Read Message History: ❌ DENY

@Unverified (Assigned automatically upon join)
  ├── In #verification:
  │     ├── View Channel: ✅ ALLOW
  │     ├── Read Message History: ✅ ALLOW
  │     ├── Send Messages: ❌ DENY (forces button/modal interactions only)
  │     └── Add Reactions: ❌ DENY (prevents reaction spam)
  └── In all other channels: ❌ DENY

@Verified Member (Granted upon successful verification)
  ├── In #verification: ❌ DENY (channel disappears once verified to keep UI clean)
  └── In public categories (#chat, #gaming, #media): ✅ ALLOW

AegisMod (Bot Role)
  ├── Manage Roles: ✅ ALLOW (must be higher in hierarchy than @Verified Member)
  └── Manage Channels: ✅ ALLOW
```

---

## 4. Slash Commands Suite (`/verify`)

All commands enforce staff-level authorization:

### 1. `/verify setup`
* **Options:** `[channel]` `[verified_role]` `[unverified_role]` `[mode]` `[min_account_age_days]`
* **Function:** Automatically configures the server, generates missing roles if needed, locks down channel permissions, and registers configuration to permanent disk storage (`data/verification_config.json`).

### 2. `/verify send`
* **Options:** `[channel]` `[title]` `[description]`
* **Function:** Posts the persistent verification banner with interactive buttons:
  * `[ ✅ Verify Now ]` (Primary Green Button)
  * `[ 📜 Server Rules ]` (Secondary Gray Button)
  * `[ 📩 Help / ModMail ]` (Direct anonymous assistance)

### 3. `/verify status`
* **Function:** Displays the server gatekeeper health dashboard:
  * Active verification mode & minimum account age requirement
  * Total verified members
  * Quarantined / pending unverified count
  * Failed attempts & blocked raid bots
  * Average time-to-verify

### 4. `/verify manual`
* **Options:** `target: @user` `action: [VERIFY | QUARANTINE | RESET]` `reason: "string"`
* **Function:** Allows moderators to manually verify stuck members, quarantine suspicious users, or force a re-verification.

---

## 5. Storage Schema: `data/verification_config.json`

```json
{
  "guildId": "123456789012345678",
  "enabled": true,
  "mode": "CAPTCHA",
  "verificationChannelId": "100000000000000001",
  "verifiedRoleId": "100000000000000002",
  "unverifiedRoleId": "100000000000000003",
  "quarantineRoleId": "100000000000000004",
  "minAccountAgeDays": 7,
  "requireAvatar": true,
  "kickOnFailedCaptcha": false,
  "captchaMaxAttempts": 3,
  "stats": {
    "totalVerified": 1420,
    "totalQuarantined": 18,
    "totalFailed": 34
  }
}
```

---

## 6. TypeScript Service Interface (`VerificationService.ts`)

```typescript
export interface VerificationConfig {
  guildId: string;
  enabled: boolean;
  mode: "BUTTON" | "CAPTCHA" | "ANTI_ALT" | "AI_PLEDGE";
  verificationChannelId?: string;
  verifiedRoleId?: string;
  unverifiedRoleId?: string;
  quarantineRoleId?: string;
  minAccountAgeDays: number;
  requireAvatar: boolean;
  kickOnFailedCaptcha: boolean;
  captchaMaxAttempts: number;
  stats: {
    totalVerified: number;
    totalQuarantined: number;
    totalFailed: number;
  };
}

export class VerificationService {
  // Evaluates a member on join (Account age, avatar, raid status)
  public async handleMemberJoin(member: GuildMember): Promise<"VERIFIED" | "UNVERIFIED" | "QUARANTINED">;
  
  // Handles button click and generates modal or completes instant pass
  public async handleVerifyClick(interaction: ButtonInteraction): Promise<void>;
  
  // Validates captcha input or AI pledge response
  public async handleSubmission(interaction: ModalSubmitInteraction): Promise<boolean>;
  
  // Promotes member roles, cleans up quarantine, records log
  public async grantVerification(member: GuildMember, method: string): Promise<void>;
}
```

---

## 7. Integration with Existing AegisMod Subsystems

1. **Anti-Raid Dynamic Lockdown Synergy:**
   * When `antiRaidService` detects join velocity exceeding threshold (e.g. >10 joins in 12s), it signals `verificationService` to dynamically elevate the gate to **Strict Captcha Mode** and raise the minimum account age to 14 days. This halts token bot raids without needing manual staff intervention.
2. **Audit Logging (`loggingService`):**
   * Every verification completion or quarantine alert generates a structured embed in `#mod-logs` containing member tag/ID, account creation date & age, verification method (`Button`, `Captcha`, `Staff Manual`), and latency/duration in gate.
3. **User Passport (`/userinfo`):**
   * Completing verification increments the user's trust score from base (e.g. +10 points).
   * Failed verification attempts or quarantine flags appear in the member's Moderation Passport history.
4. **Anonymous ModMail (`/modmail`):**
   * Quarantined members have an in-channel button allowing them to open a private ticket to appeal or request manual verification if they are a genuine new Discord user.
5. **Disk Persistence (`storagePath.ts`):**
   * Configuration and ongoing stats are saved via canonical JSON persistence to prevent data loss across bot restarts or server container reboots.
