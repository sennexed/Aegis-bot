# Feature 05: Compliance Audit Log & Transparency Exporter (`/exportlogs`)

## 1. Overview & Purpose
School administrations, community sponsors, Discord Trust & Safety, and GDPR compliance inquiries frequently require verifiable documentation of moderation actions taken against bad actors.
The **Audit Log & Transparency Exporter** (`auditExportService.ts`) serializes server moderation events into standardized formats (CSV, JSON, Markdown Summaries) for off-platform transparency and legal compliance.

---

## 2. Supported Export Formats & Fields

### Standard CSV Format
```csv
CaseID,Timestamp,TargetUserID,TargetUserTag,Action,Duration,ModeratorTag,Reason,EvidenceLink
CASE-1048,2026-09-17T03:45:00Z,9812903129012,BadActor#9912,BAN,Indefinite,System AutoMod,Zero-tolerance predatory grooming attempt detected,https://discord.com/channels/...
CASE-1047,2026-09-17T01:20:00Z,4819203912039,ScamBot#0014,TIMEOUT_24H,24 Hours,AegisMod AI,Phishing link distribution: discrod-gift-nitro.ru,https://discord.com/channels/...
```

### JSON Data Dump
```json
{
  "guildId": "123456789012345678",
  "generatedAt": "2026-10-18T05:20:00Z",
  "totalRecords": 248,
  "filtersApplied": {
    "days": 30,
    "action": "ALL"
  },
  "summary": {
    "bans": 14,
    "timeouts": 62,
    "kicks": 8,
    "warnings": 164
  },
  "records": [...]
}
```

---

## 3. Slash Command Specification (`/exportlogs`)

- **Options:**
  - `timeframe`: `7_DAYS`, `30_DAYS`, `90_DAYS`, `ALL_TIME`
  - `format`: `CSV`, `JSON`, `SUMMARY_EMBED`
  - `action`: `ALL`, `BAN`, `TIMEOUT`, `WARN`, `KICK`
  - `target_user`: `@User` *(optional filter for user-specific Subject Access Requests)*
- **Security Check:**
  - Restricted strictly to `Administrator` permission or designated Audit Officer roles.
  - Generates an in-memory buffer and uploads as an ephemeral Discord attachment to prevent accidental public disclosure.
