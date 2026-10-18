# Feature 06: User Moderation Passport & Dynamic Trust Score (`/userinfo`)

## 1. Overview & Purpose
When a moderator confronts a disruptive user, knowing context is critical: is this an established 2-year veteran having an isolated bad day, or a 3-hour-old burner account joined to spam invite links?
The **User Moderation Passport** (`userinfo.ts`) aggregates infraction history, server tenure, Discord account age, and active strikes into a unified **Dynamic Trust Score (0–100%)**.

---

## 2. Dynamic Trust Score Calculation Formula

$$\text{Trust Score} = 100 - (10 \times \text{Warns}) - (20 \times \text{Mutes}) - (35 \times \text{Kicks}) - (50 \times \text{Bans}) + \text{TenureBonus} - \text{AccountAgePenalty}$$

### Modifiers:
- **New Account Penalty:** If Discord account age $< 7 \text{ days}$, $-15$ points; if $< 30 \text{ days}$, $-5$ points.
- **Tenure Bonus:** If server membership $> 90 \text{ days}$ with zero active strikes, $+5$ bonus points.
- **Clamped Range:** $0 \le \text{Score} \le 100$.

### Risk Tiers:
| Trust Score Range | Risk Tier | Color Indicator | Recommended Moderation Stance |
|---|---|---|---|
| **90 – 100%** | `CLEAN` | 🟢 Emerald | Standard warning, assume good faith. |
| **70 – 89%** | `LOW_RISK` | 🔵 Blue | Formal warning or short cooldown timeout. |
| **40 – 69%** | `MEDIUM_RISK` | 🟡 Amber | 24-hour timeout; escalate to senior staff. |
| **0 – 39%** | `HIGH_RISK` | 🔴 Rose | Quarantine or permanent removal; potential alt/raid bot. |

---

## 3. Passport Visual Embed Layout (`/userinfo target:@user`)

```
┌─────────────────────────────────────────────────────────────┐
│  USER MODERATION PASSPORT • AlexGamer16                     │
├─────────────────────────────────────────────────────────────┤
│  Trust Score: 80/100 [LOW_RISK]                             │
│  Account Age: 45 days               Server Tenure: 14 days  │
│  Active Strikes (30d): 2            Active Timeout: None    │
├─────────────────────────────────────────────────────────────┤
│  📜 Infraction History (Last 5 Records)                     │
│  • ⚠️ [WARN] CASE-104: Inappropriate slang in general       │
│  • ⏳ [MUTE] CASE-108: 1-hour timeout (Second strike)        │
└─────────────────────────────────────────────────────────────┘
```
