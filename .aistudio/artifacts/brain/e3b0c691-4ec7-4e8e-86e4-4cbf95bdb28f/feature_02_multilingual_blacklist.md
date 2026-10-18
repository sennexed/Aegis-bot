# Feature 02: Central Multilingual Blacklist Engine

## 1. Overview & Purpose
Global online communities frequently experience toxic language disguised in non-English scripts, mixed transliterations (e.g. Hinglish, Arabizi, Cyrillic homoglyphs), and leetspeak substitution to evade standard AutoMod filters. The **Central Multilingual Blacklist Engine** (`centralBlacklistService.ts`) detects, normalizes, and intercepts these terms with zero external API calls.

---

## 2. Multi-Script Coverage Matrix

| Language / Dialect | Script Type | Example Bypass Tactics Intercepted |
|---|---|---|
| **Hindi & Hinglish** | Devanagari & Latin Transliteration | Inappropriate Hindi profanity written phonetically in English (e.g., Romanized swearwords) and native Devanagari Unicode. |
| **Russian & Slavic** | Cyrillic & Translit | Cyrillic obscenities (`мат`) and Latin character homoglyphs (e.g. using `а`, `е`, `о`, `р`, `с`, `х` to mask English words). |
| **Arabic & Arabizi** | Arabic & Chat Numbers | Arabic numeral substitutions (e.g., using `3` for 'ain, `7` for ha) and dialect-specific derogatory phrases. |
| **Leetspeak & Obfuscation** | ASCII Symbol Maps | Zero-width spaces, zalgo combining diacritics, repeating character padding (e.g. `s.l.u.r`, `f@@@k`). |

---

## 3. Text Normalization Pipeline

```
Raw Message Input: "f.u.c.k! y0u b3hnch0d!"
         │
         ▼
[1. Zalgo & Combining Diacritics Stripping]
  • Strips Unicode diacritical marks (\u0300-\u036f)
         │
         ▼
[2. Homoglyph & Leetspeak Replacement]
  • 0 -> o, 1 -> i/l, 3 -> e, 4 -> a, 5 -> s, 7 -> t, @ -> a, $ -> s
         │
         ▼
[3. Whitespace & Punctuation Collapsing]
  • Collapses intentional spacing ("s l u r" -> "slur")
         │
         ▼
[4. Phonetic & Lexicon Lookups]
  • Exact & Substring Match against active Server Lexicon
         │
         ▼
[5. Intercept Decision]
  • If detected: Delete message, issue automated warning/timeout, log exact match & language in #mod-logs.
```

---

## 4. Persistent JSON Schema (`central_blacklist.json`)

```json
{
  "guildId": "123456789012345678",
  "version": "2.4.0",
  "updatedAt": "2026-10-18T05:00:00Z",
  "entries": [
    {
      "id": "term-hindi-01",
      "term": "madarchod",
      "language": "Hindi",
      "severity": "HIGH",
      "category": "ABUSIVE_PROFANITY",
      "notes": "Built-in verified Hindi offensive terminology",
      "addedBy": "System Verified Lexicon"
    },
    {
      "id": "term-ar-02",
      "term": "sharmouta",
      "language": "Arabic",
      "severity": "HIGH",
      "category": "HARASSMENT",
      "notes": "Built-in verified Arabic offensive terminology",
      "addedBy": "System Verified Lexicon"
    }
  ]
}
```

---

## 5. Web UI & Management Dashboard
Staff can inspect, add, delete, import, export, and restore verified default vocabularies directly from the **Multilingual Blacklist Manager** tab in the AegisMod web dashboard.
