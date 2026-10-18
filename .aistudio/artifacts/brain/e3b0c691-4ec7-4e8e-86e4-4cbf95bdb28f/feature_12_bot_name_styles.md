# Feature 12: Discord Bot Name Styles, Clan Badges & REST API Generator (`/namestyle`)

## 1. Overview & Purpose
Adolescent gaming and hobby servers heavily value aesthetic customization, branding, and role colors. 
The **Bot Name Styles & REST API Engine** (`botNameStylesService.ts`) enables server owners to transform AegisMod's nickname using curated Unicode typography, clan tags, role color palettes, and Discord API payload generation.

---

## 2. Typography & Visual Effects Catalog

### 12 Discord Font Transformations
1. **Bold Sans** (`𝗔𝗲𝗴𝗶𝘀𝗠𝗼𝗱`)
2. **Bold Serif** (`𝐀𝐞𝐠𝐢𝐬𝐌𝐨𝐝`)
3. **Italic Sans** (`𝘈𝘦𝘨𝘪𝘴𝘔𝘰𝘥`)
4. **Script / Cursive** (`𝒜𝑒𝑔𝒾𝓈𝑀𝑜𝒹`)
5. **Gothic / Fraktur** (`𝔄𝔢𝔤𝔦𝔰𝔐𝔬𝔡`)
6. **Double-Struck / Blackboard** (`𝔸𝕖𝕘𝕚𝕤𝕄𝕠𝕕`)
7. **Monospace / Hacker** (`𝙰𝚎𝚐𝚒𝚜𝙼𝚘𝚍`)
8. **Small Caps** (`ᴀᴇɢɪsᴍᴏᴅ`)
9. **Circled** (`ⒶⓔⓖⓘⓢⓂⓞⓓ`)
10. **Squared Negative** (`🅰🅴🅶🅸🆂🅼🅾🅳`)
11. **Fullwidth Aesthetic** (`ＡｅｇｉｓＭｏｄ`)
12. **Inverted / Upside Down** (`poWsᴉƃǝ∀`)

### 6 Visual Framing Effects
- **Clan Tag Prefix:** `[AEGIS] AegisMod`
- **Security Sparkles:** `✨ AegisMod ✨`
- **Guardian Shield:** `🛡️ AegisMod 🛡️`
- **Japanese Aesthetic Corners:** `【 AegisMod 】`
- **Winged Brackets:** `꧁ AegisMod ꧂`
- **Cyber Diamond Borders:** `❖ AegisMod ❖`

---

## 3. Discord REST API Payload Generation

The service generates compliant JSON payloads compatible with Discord's REST API endpoint `PATCH /users/@me` or `PATCH /guilds/{guild.id}/members/@me`:

```json
{
  "nick": "[AEGIS] 𝗔𝗲𝗴𝗶𝘀𝗠𝗼𝗱 🛡️",
  "name_style": {
    "font_id": "bold_sans",
    "effect_id": "clan_shield",
    "clan_tag": "AEGIS",
    "colors": [5793266, 1752220]
  }
}
```

### Color Conversion Utility
Converts hex color codes to Discord API integers (e.g., `#5865F2` -> `5793266`).

---

## 4. Slash Command (`/namestyle`)
- `/namestyle preview` — Interactive UI displaying all 12 fonts and 6 visual frames.
- `/namestyle apply [font] [effect] [clan_tag] [hex_color]` — Applies the nickname and updates the bot role color dynamically in the guild.
- `/namestyle reset` — Restores the bot's default title `AegisMod`.
