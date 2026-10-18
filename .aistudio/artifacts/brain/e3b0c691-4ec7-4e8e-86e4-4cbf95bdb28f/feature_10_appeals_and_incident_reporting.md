# Feature 10: Infraction Appeals (`/appeal`) & Incident Reporting (`/report`)

## 1. Overview & Purpose
Adolescent moderation systems require strong checks and balances to prevent feelings of unfair treatment, while empowering members to report subtle harassment that automated filters might miss.
AegisMod includes:
- **Formal Appeals System (`appeal.ts`):** Transparent due process for penalized users to explain context, provide apologies, and request case reconsideration.
- **Incident Reporting & Staff Pager (`report.ts`):** Slash commands and Discord Context Menu actions enabling users to discreetly report messages or users with jump links and attached evidence.

---

## 2. Formal Appeals Pipeline (`/appeal`)

```
Penalized Member Runs /appeal submit
         │
         ▼
[1. Case Verification]
  • Looks up Case ID in local database (e.g. CASE-1043).
  • Validates user ownership of the penalty.
         │
         ▼
[2. Appeal Modal Submission]
  • Input: Reason for appeal & explanation of context.
  • Input: Corrective commitment / apology statement.
         │
         ▼
[3. Staff Review Dispatch]
  • Embed dispatched to private #appeals-review channel.
  • Contains: Original infraction, chat context, trust score, and action buttons.
         │
         ▼
[4. Staff Decision: APPROVE / DENY]
  • If Approved: Removes timeout/ban, notifies user via DM, updates case status.
  • If Denied: Logs reviewer notes, sends respectful closure DM to user.
```

---

## 3. Incident Reporting & Context-Menu Pager (`/report`)

### Reporting Methods
1. **Slash Command:** `/report target:@user reason:"Asking for personal Instagram in DMs" [evidence_url]`
2. **Discord Context-Menu Interaction:** Right-click on any message -> `Apps` -> `Report Message to AegisMod Staff`.

### Real-Time Dispatch to On-Duty Staff
When reported, an embed is dispatched to `#staff-reports`:
- **Report ID:** e.g. `REP-401`
- **Reporter:** `AlexGamer16#1029` (Anonymous to reported user)
- **Reported User:** `TrollUser#9102`
- **Channel & Jump Link:** Direct link to message in `#gaming-banter`
- **On-Duty Staff Ping:** Smart ping directed to active duty moderators.
- **Moderator Quick Action Buttons:** `[ Timeout 1h ]`, `[ Delete Message ]`, `[ Dismiss Report ]`.
