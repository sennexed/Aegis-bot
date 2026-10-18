# AegisMod: Complete Feature Architecture & Specification Portfolio

AegisMod is a hybrid Discord moderation, safety, and community governance platform engineered specifically for adolescent (~16 y/o) communities. It combines deterministic speed with Gemini 2.5 Flash Lite intelligence, zero-token fast triage, and enterprise-grade administrative operations.

---

## Master Feature Portfolio

| # | Feature Domain | Key Commands / Service | Artifact Reference |
|---|---|---|---|
| **01** | **Hybrid AI Moderation & Triage Engine** | `triageService`, `geminiModerationService` | `feature_01_hybrid_ai_moderation.md` |
| **02** | **Central Multilingual Blacklist Engine** | `centralBlacklistService`, `profanityFilter` | `feature_02_multilingual_blacklist.md` |
| **03** | **Staff Duty & Shift Tracker** | `/duty`, `dutyService` | `feature_03_staff_duty_and_loa.md` |
| **04** | **Staff Leave of Absence (LOA) Management** | `/loa`, `loaService` | `feature_03_staff_duty_and_loa.md` |
| **05** | **Anonymous Staff Mod-Mail System** | `/modmail`, `modMailService` | `feature_04_anonymous_modmail.md` |
| **06** | **Compliance Audit Log & Transparency Exporter** | `/exportlogs`, `auditExportService` | `feature_05_audit_exporter_and_transparency.md` |
| **07** | **User Moderation Passport & Trust Score** | `/userinfo`, `traditionalModService` | `feature_06_user_passport_and_trust_score.md` |
| **08** | **Interactive Mod-Log Buttons & Action Pipeline** | `loggingService` | `feature_07_modlog_buttons_and_strike_escalation.md` |
| **09** | **Progressive Strike Escalation Matrix** | `policyEngine`, `traditionalModService` | `feature_07_modlog_buttons_and_strike_escalation.md` |
| **10** | **Phishing, Invite & Scam Interceptor** | `phishingFilter`, `autoModService` | `feature_08_phishing_and_anti_raid.md` |
| **11** | **Anti-Raid Dynamic Gatekeeper** | `/antiraid`, `antiRaidService` | `feature_08_phishing_and_anti_raid.md` |
| **12** | **Per-Channel Safety Sensitivity Profiles** | `/channelpolicy`, `channelPolicyService` | `feature_09_channel_safety_policies.md` |
| **13** | **Infraction Appeals & Due Process** | `/appeal`, `traditionalModService` | `feature_10_appeals_and_incident_reporting.md` |
| **14** | **Incident Reporting & Staff Pager** | `/report`, Context Menu, `report.ts` | `feature_10_appeals_and_incident_reporting.md` |
| **15** | **Verification & Member Gatekeeper** | `/verify`, `verificationService` | `verification_system_blueprint.md` |
| **16** | **AutoNews 13-Newspaper Scheduler** | `/news`, `autoNewsBotService` | `feature_11_autonews_broadcaster.md` |
| **17** | **Discord Bot Name Styles & Clan Badges** | `/namestyle`, `botNameStylesService` | `feature_12_bot_name_styles.md` |
| **18** | **Zero-Config Setup & Storage Persistence** | `/setup`, `storagePath.ts`, `guildMemoryService` | `feature_13_server_memory_and_persistence.md` |

---

## Architectural Principles
1. **Zero-Token Fast Triage First:** 80–90% of chat traffic (short phrases, gamer banter, whitelisted GIF domains) is resolved in 0ms with zero API overhead.
2. **Deterministic Fallbacks:** If the Gemini API is unreachable, AegisMod operates uninterrupted using local regexes, phonetic leetspeak decoders, and multilingual lexicons.
3. **Teen Community Safety:** Specific protections against grooming, solicitation of personal identifiable information (PII), cyberbullying, and self-harm.
4. **Permanent Disk Persistence:** All configurations, channel bindings, and active state survive bot restarts and host reboots via canonical JSON storage.

---

## Complete Command Inventory

| Slash Command | Available Subcommands & Options | Permission Level |
|---|---|---|
| `/news` | `config` *(view/update settings)*, `configure` *(alias)*, `digest` *(13 papers)*, `source` *(single paper)*, `broadcast` *(post to channel)*, `status` | Public / Admins for config |
| `/verify` | `config` *(view/update)*, `setup`, `send` *(post embed)*, `status`, `manual` *(force verify/quarantine)* | Manage Guild |
| `/automod` | `config` *(view/update)*, `status`, `toggle` *(enable/disable rule)*, `sync` *(native Discord sync)* | Manage Guild |
| `/antiraid` | `config` *(view/update)*, `status`, `lockdown` *(enable/disable)* | Administrator |
| `/channelpolicy` | `config` *(view/update)*, `set` *(apply profile)*, `view` *(inspect)*, `list` *(all overrides)* | Manage Channels |
| `/duty` | `on` *(clock in with note)*, `off` *(clock out)*, `list` *(active roster)*, `status` *(alias)* | Moderate Members |
| `/modmail` | `open` *(open ticket)*, `create` *(alias)*, `reply` *(staff response)*, `close`, `transcript` | Public / Staff for reply |
| `/namestyle` | `config` *(view/update)*, `view` *(current style)*, `list` *(12 fonts & 6 effects)*, `set`, `sync` | Manage Guild |
| `/setup` | Interactive onboarding wizard for roles & `#mod-logs` channel | Administrator |
| `/userinfo` | `target:@user` *(moderation passport, trust score 0–100)* | Moderate Members |
| `/exportlogs` | `timeframe`, `format` (CSV/JSON/Summary), `action`, `target_user` | Administrator |
| `/appeal` | `case_id`, `reason` *(formal due process)* | Public |
| `/report` | `target:@user`, `reason`, `evidence_url` *(dispatches to on-duty staff)* | Public |
| `/testmod` | `content` *(safe preview through AutoMod, Triage, and Gemini)* | Manage Messages |
| `/modstats` | Weekly moderation digest, peak violation hours, and activity | Moderate Members |
| `/warn` | `target:@user`, `reason` *(logged strike)* | Moderate Members |
| `/mute` | `target:@user`, `duration` (10m, 1h, 1d), `reason` | Moderate Members |
| `/unmute` | `target:@user`, `reason` *(removes timeout)* | Moderate Members |
| `/kick` | `target:@user`, `reason` | Kick Members |
| `/ban` | `target:@user`, `reason`, `prune_days` | Ban Members |

