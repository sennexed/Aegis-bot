# Feature 04: Anonymous Staff Mod-Mail & Private Support (`/modmail`)

## 1. Overview & Purpose
In adolescent communities, victims of bullying, harassment, or predatory behavior are often afraid to message moderators publicly or in personal direct messages for fear of retaliation. 
**AegisMod Anonymous Mod-Mail** (`modMailService.ts`) creates a secure, bidirectional communication bridge between a member's DMs and a private `#mod-mail-threads` forum/channel inside the Discord server.

---

## 2. Bidirectional Relay Architecture

```
Member's Direct Messages (DM)                 Private Staff Forum (#mod-mail)
         │                                                   │
         │  1. Member sends "/modmail" or direct DM          │
         ├──────────────────────────────────────────────────>│
         │                                                   │ Creates Thread: "ticket-Jordan-1001"
         │                                                   │ Shows User Tag, Category, History
         │                                                   │
         │  2. Staff replies: "/modmail reply text:..."      │
         │<──────────────────────────────────────────────────┤
         │ Receives DM as "AegisMod Staff (Anonymous)"       │ (Staff identity shielded by default)
         │                                                   │
         │  3. Member responds in DM                         │
         ├──────────────────────────────────────────────────>│ Updates active thread
```

---

## 3. Key Safety & Shielding Capabilities

1. **Staff Identity Shielding:**
   - When a moderator replies, the message dispatched to the user is signed as `🛡️ AegisMod Staff`.
   - Prevents angry or toxic offenders from hunting down personal accounts of teen moderators.
   - Admins can toggle *Display Moderator Name* if needed for formal hearings.
2. **Category Pre-Triage:**
   - Member selects ticket category upon opening:
     - `BULLYING_HARASSMENT` (Priority High)
     - `PREDATORY_DM_REPORT` (Priority Critical)
     - `APPEAL_INQUIRY`
     - `GENERAL_SUPPORT`
3. **Automatic Audit Archival:**
   - When a ticket is closed via `/modmail close`, the entire conversation transcript is compiled and sent to `#mod-logs` with a permanent case reference number.

---

## 4. Slash Commands Suite

- `/modmail open [category] [subject]` — Member command to initialize a ticket.
- `/modmail reply [ticket_id] [message] [anonymous: true/false]` — Staff command to send response.
- `/modmail close [ticket_id] [closing_reason]` — Closes ticket, notifies user, and archives transcript.
- `/modmail transcript [ticket_id]` — Exports HTML/JSON transcript of the session.
