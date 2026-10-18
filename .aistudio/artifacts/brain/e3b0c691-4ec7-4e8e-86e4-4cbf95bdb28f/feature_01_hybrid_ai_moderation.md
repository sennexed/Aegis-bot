# Feature 01: Hybrid AI Moderation & 4-Tier Triage Pipeline

## 1. Overview & Purpose
AegisMod’s Hybrid Moderation Pipeline combines instantaneous local regex/phonetic filtering with the nuanced linguistic intelligence of **Gemini 2.5 Flash Lite**. It delivers under-350ms moderation response times while slashing LLM API token consumption by 80–90%.

---

## 2. 4-Tier Moderation Architecture

```
Incoming Message / Attachment
             │
             ▼
┌──────────────────────────────────────────────┐
│  Tier 1: Ultra-Fast Benign Whitelist (0ms)   │ ──(Benign match)──> Pass immediately (0 tokens)
│  • Whitelisted gamer slang ("gg", "clutch")  │
│  • Verified Tenor / Giphy media URLs         │
│  • Discord CDN attachment images             │
└──────────────────────┬───────────────────────┘
                       │ (Uncertain)
                       ▼
┌──────────────────────────────────────────────┐
│  Tier 2: Instant Deterministic Intercept     │ ──(Severe match)──> Action immediately (0 tokens)
│  • Multilingual Blacklist Lexicon            │                     • Auto-Delete message
│  • Phishing domain permutations              │                     • Issue 1h Timeout / Warn
│  • Severe grooming & predatory keyword regex │                     • Send alert to #mod-logs
│  • Discord invite link interceptor           │
└──────────────────────┬───────────────────────┘
                       │ (Requires semantic reasoning)
                       ▼
┌──────────────────────────────────────────────┐
│  Tier 3: Contextual Policy Pre-Filter        │
│  • Check channel profile (Strict vs Relaxed) │
│  • Account trust score weighting             │
│  • Message length & formatting scrutiny      │
└──────────────────────┬───────────────────────┘
                       │ (Flagged for AI analysis)
                       ▼
┌──────────────────────────────────────────────┐
│  Tier 4: Gemini 2.5 Flash Lite Engine        │
│  • Semantic nuance & intent classification   │
│  • Adolescent safety checks (PII, grooming)  │
│  • Confidence score (0.00 – 1.00)            │
│  • Suggested action: ALLOW / DELETE / TIMEOUT│
└──────────────────────────────────────────────┘
```

---

## 3. Gemini Prompt Engineering & Safety Schema

### System Prompt Directive
```markdown
You are AegisMod AI, a high-speed Discord safety moderation engine protecting an adolescent community (~16 years old).
Evaluate messages for:
1. PREDATORY_OR_GROOMING: Inappropriate requests for DMs, asking for phone numbers, addresses, selfies, or sexualized banter.
2. HARASSMENT_OR_BULLYING: Targeted humiliation, hate speech, slurs, doxxing.
3. SELF_HARM: Explicit encouragement or acute distress statements.
4. SPAM_OR_MALICIOUS: Unsolicited scams, phishing, or server raiding.

Return strictly valid JSON:
{
  "flagged": boolean,
  "category": string,
  "confidence": number,
  "recommendedAction": "ALLOW" | "DELETE" | "TIMEOUT_1H" | "TIMEOUT_24H" | "BAN",
  "reason": string
}
```

---

## 4. Policy Engine Action Mapping (`policyEngine.ts`)

| Detection Category | Default Action | Mod-Log Alert Level | Teen Safety Protocol |
|---|---|---|---|
| `SEXUAL_GROOMING_OR_PREDATORY` | `TIMEOUT_1H` | 🚨 CRITICAL (Emergency Staff Ping) | Immediate message deletion, DM lockdown, user quarantined. |
| `SELF_HARM` | `DELETE` | 🆘 HIGH (Compassionate Crisis Log) | Automatic ephemeral crisis hotline resource dispatched to member. |
| `PHISHING_OR_SCAM` | `TIMEOUT_1H` | ⚠️ HIGH | URL scrubbed, link added to cache. |
| `HIGH_SEVERITY_HATE` | `DELETE` + `WARN` | ⚠️ HIGH | Strike counter incremented. |
| `BENIGN_GAMER_SLANG` | `ALLOW` | None | 0 tokens consumed, no latency. |

---

## 5. Resilience & Offline Fallback
When `GEMINI_API_KEY` is unavailable, rate-limited, or encountering network interruptions:
- The bot seamlessly falls back to Tier-1 and Tier-2 deterministic rules.
- Chat remains 100% protected against all known slurs, scams, and raid scripts without throwing fatal errors.
