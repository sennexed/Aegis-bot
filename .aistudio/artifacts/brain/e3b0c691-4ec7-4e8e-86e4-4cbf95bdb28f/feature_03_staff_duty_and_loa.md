# Feature 03: Staff Duty Tracker (`/duty`) & Leave of Absence (`/loa`)

## 1. Overview & Purpose
Volunteer moderation teams often struggle with shift accountability, coverage gaps during peak teen chatting hours, and burnout. AegisMod introduces two interconnected governance modules:
- **Staff Duty Tracker (`dutyService.ts`):** Records real-time moderator on-duty shifts, active status, and routes urgent user reports exclusively to active staff.
- **Leave of Absence Management (`loaService.ts`):** Enables staff members to request exams, holiday, or illness leave, automatically applying an `@On Leave` role and removing them from emergency alert rotations.

---

## 2. Staff Duty Tracker (`/duty`)

### Commands
- `/duty on [note]` — Clocks the staff member in, adds `@Staff on Duty` badge, and logs shift start time.
- `/duty off` — Clocks out, logs total shift duration, and summarizes actions taken during the shift.
- `/duty status` — Lists all currently active moderators, their active minutes, and coverage notes.

### Smart Report Routing
When a member invokes `/report` or an emergency groomer/raid alert fires:
```
Emergency Incident Triggered
           │
           ▼
[DutyService.getActiveStaff()]
  ├── Any staff currently ON-DUTY?
  │     ├── YES ──> Ping ONLY active on-duty moderators in #mod-alerts.
  │     └── NO  ──> Escalate to @here / Admin on-call rotation.
```
*Prevents waking off-duty high school students or volunteers during late night hours.*

---

## 3. Leave of Absence System (`/loa`)

### Workflow
1. **Request Submission:** Staff member runs `/loa request days:14 reason:"Midterm exams week"`.
2. **Review & Approval:** Admins receive a dedicated embed in `#staff-management` with `[Approve]` and `[Deny]` action buttons.
3. **Role Suspension:**
   - Once approved, `loaService` records the active leave window.
   - Moderator receives `@On Leave (LOA)` role.
   - Bot temporarily excludes them from duty schedules and attendance quotas.
4. **Auto-Reinstatement:**
   - When the expiration timestamp is reached, the bot automatically removes `@On Leave` and restores active moderator standing.

---

## 4. Persistent JSON Schema (`staff_duty_loa.json`)

```json
{
  "guildId": "123456789012345678",
  "activeShifts": [
    {
      "userId": "29182910283019284",
      "userTag": "Sarah_Mod#4012",
      "clockedInAt": 1729227600000,
      "note": "Evening safety monitoring in #gaming-banter"
    }
  ],
  "activeLeaves": [
    {
      "id": "LOA-102",
      "userId": "98127391823910293",
      "userTag": "JakeSenior#9901",
      "startDate": "2026-10-15T00:00:00Z",
      "endDate": "2026-10-22T00:00:00Z",
      "reason": "College entrance examination preparation",
      "status": "APPROVED",
      "approvedBy": "ElenaAdmin#0003"
    }
  ]
}
```
