# Feature 09: Per-Channel Safety Sensitivity Policy Profiles (`/channelpolicy`)

## 1. Overview & Purpose
A one-size-fits-all moderation model fails in multi-purpose Discord communities:
- `#general` requires clean, family-friendly communication.
- `#gaming-banter` permits mild competitive slang (*"trash", "noob", "ez"*) that would trigger alarms in school channels.
- `#mental-health-support` requires maximum empathy, crisis hotline assistance, and zero toleration of trolling.
- `#announcements` prohibits casual replies entirely.

**Channel Policy Profiles** (`channelPolicyService.ts`) allows administrators to bind distinct sensitivity rules to individual Discord channels.

---

## 2. Policy Profile Definitions

| Profile | Target Channel | Slang & Banter | Profanity Threshold | Self-Harm Stance | Phishing & Invites |
|---|---|---|---|---|---|
| **`FAMILY_FRIENDLY`** | `#general`, `#study-lounge` | Moderate | Zero-Tolerance | Immediate crisis help | Block & Warn |
| **`GAMING_BANTER`** | `#gaming`, `#clips`, `#valorant` | High (Permits "ez", "noob", "bot") | Mild allowed | Immediate crisis help | Block & Warn |
| **`STRICT_SAFETY`** | `#younger-teens`, `#introductions` | Low | Zero-Tolerance | Immediate crisis help | Immediate Delete & Timeout |
| **`COMPASSIONATE_SUPPORT`**| `#venting`, `#mental-health` | None | Low | Direct Hotline Embed | Zero-Tolerance |
| **`OFFICIAL_ANNOUNCEMENTS`**| `#announcements`, `#rules` | N/A | Zero-Tolerance | N/A | Strict Staff-Only |

---

## 3. Slash Command Suite (`/channelpolicy`)

- `/channelpolicy set channel:#gaming profile:GAMING_BANTER` — Binds the specified profile to the channel.
- `/channelpolicy list` — Displays all configured channel overrides and active profiles across the server.
- `/channelpolicy reset channel:#gaming` — Clears overrides and returns the channel to the server's default safety baseline.

---

## 4. Permanent Disk Persistence (`channel_policies.json`)

```json
{
  "guildId": "123456789012345678",
  "defaultProfile": "FAMILY_FRIENDLY",
  "channelOverrides": {
    "100291029102910001": "GAMING_BANTER",
    "100291029102910002": "COMPASSIONATE_SUPPORT",
    "100291029102910003": "STRICT_SAFETY"
  }
}
```
*Channel bindings are persisted using `storagePath.ts` and survive bot restarts without resetting.*
