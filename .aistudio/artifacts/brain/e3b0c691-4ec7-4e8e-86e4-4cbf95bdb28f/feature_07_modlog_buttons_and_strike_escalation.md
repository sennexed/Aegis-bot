# Feature 07: Interactive Mod-Log Action Buttons & Strike Escalation Matrix

## 1. Overview & Purpose
When AutoMod or Gemini AI flags an infraction in `#mod-logs`, staff shouldn't need to manually type slash commands like `/ban user:123 reason:...`. 
AegisMod equips every audit log embed with **Persistent Interactive Action Buttons** (`loggingService.ts`), allowing moderators to confirm penalties, adjust durations, or dismiss false positives with one click.

---

## 2. Interactive Mod-Log Button Architecture

Every `#mod-logs` alert includes a Discord `ActionRowBuilder` with 4 standardized action buttons:

```
[ 🔨 Ban Member ]     [ ⏳ 1h Timeout ]     [ ❌ Dismiss & Whitelist ]     [ 🛡️ Escalate to Admin ]
 (Danger / Red)       (Primary / Blurple)   (Secondary / Gray)             (Success / Green)
```

### Action Logic
- **`Ban Member`:** Executes `guild.members.ban(targetId)` with the reason recorded from the AI report.
- **`1h Timeout`:** Executes `member.timeout(3600000, reason)` to mute voice & text.
- **`Dismiss & Whitelist`:** Deletes the warning or adds the phrase to the server's false-positive exception list.
- **`Escalate to Admin`:** Re-dispatches the alert to `#admin-hotline` and pings on-duty administrators.

---

## 3. Automated Progressive Strike Escalation Matrix

To ensure fair due process for teenagers, minor offenses automatically escalate along a deterministic strike ladder:

```
Offense Count (Within 30-Day Window)
  │
  ├── Strike 1 ──> Formal Written Warning
  │                 • Ephemeral DM with rules reminder & educational guidance.
  │
  ├── Strike 2 ──> 1-Hour Communication Timeout
  │                 • Temporary voice and text mute to allow cooldown.
  │
  ├── Strike 3 ──> 24-Hour Cooling-Off Timeout
  │                 • Extended restriction; notification sent to senior moderators.
  │
  └── Strike 4+ ─> Permanent Server Ban
                    • Zero-tolerance limit reached; appeal eligible via /appeal.
```

### Strike Decay & Cooldowns
- Strikes expire automatically **30 days** after issuance, rewarding positive behavior improvements.
- Severe zero-tolerance offenses (predatory grooming, credit card phishing, mass raid bots) bypass the strike ladder directly into an immediate ban.
