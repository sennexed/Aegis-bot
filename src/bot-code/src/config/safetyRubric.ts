/**
 * AegisMod Safety Rubric
 * Strict Community Standards for Teen-Focused Servers (Age ~16)
 */

export const TEEN_SAFETY_RUBRIC = {
  version: "2.5-nonstrict-safe",
  targetAudience: "Communities with adolescents aged ~16",
  description:
    "Proactive youth safety with supportive, non-strict restorative moderation. Permanent bans are disabled.",
  
  categories: {
    SEXUAL_GROOMING_OR_PREDATORY: {
      description: "Any adult-to-minor solicitation, asking teens for intimate photos, Snapchat/secret DMs, secret meetups, sexualizing underage users.",
      defaultSeverity: "CRITICAL",
      defaultAction: "TIMEOUT_1H",
      requiresStaffPing: true
    },
    SELF_HARM: {
      description: "Encouraging suicide ('kys', 'kill yourself'), glorifying self-harm, suicide pacts or harassment urging self-injury.",
      defaultSeverity: "CRITICAL",
      defaultAction: "DELETE",
      requiresStaffPing: true
    },
    DOXXING_OR_PII: {
      description: "Leaking real full names, home addresses, phone numbers, schools, family details, or private social media handles of minors.",
      defaultSeverity: "HIGH",
      defaultAction: "DELETE",
      requiresStaffPing: true
    },
    HATE_SPEECH: {
      description: "Dehumanizing attacks, slurs, or systemic hatred based on race, ethnicity, sexual orientation, gender identity, religion, or disability.",
      defaultSeverity: "HIGH",
      defaultAction: "DELETE",
      requiresStaffPing: true
    },
    CYBERBULLYING: {
      description: "Targeted humiliation, malicious group exclusion, persistent vicious mocking, degradation of a peer.",
      defaultSeverity: "MEDIUM",
      defaultAction: "DELETE",
      requiresStaffPing: false
    },
    HARASSMENT: {
      description: "Persistent abusive name-calling, non-consensual sexualized jokes, invasive personal insults.",
      defaultSeverity: "MEDIUM",
      defaultAction: "DELETE",
      requiresStaffPing: false
    },
    SEVERE_PROFANITY_OR_ABUSE: {
      description: "Aggressive or vulgar swearing directed at individuals, bypass tactics (leetspeak, spaced characters, zero-width characters).",
      defaultSeverity: "LOW",
      defaultAction: "WARN",
      requiresStaffPing: false
    }
  },

  geminiSystemInstruction: `You are AegisMod, a specialized Discord moderation AI tailored for an online community where members are around 16 years old.
Your core mission is to uphold teen safety standards through supportive and non-strict moderation, preventing abuse, predatory behavior, cyberbullying, doxxing, self-harm, hate speech, and severe vulgarity.
Maintain a welcoming bar for respectful communication, while distinguishing genuine harmless gaming banter (e.g., "you're so bad at this game lol", "bro that aim was trash") from malicious targeted harassment (e.g., "nobody likes you, leave this server", "kill yourself").

POLICY DIRECTIVE:
- PERMANENT BANS ARE DISABLED: Never recommend "BAN" under any circumstances.
- NON-STRICT PUNISHMENT PHILOSOPHY: Do not recommend harsh or long timeouts. For severe predatory grooming or critical threats, the maximum recommended action is "TIMEOUT_1H" with immediate staff notification so human moderators can review. For self-harm, recommend "DELETE" with compassionate crisis helpline guidance. For spam, harassment, doxxing, and profanity, recommend "DELETE" or "WARN".

Categories:
- "NONE": Safe, acceptable casual teen conversation.
- "CYBERBULLYING": Targeted humiliation, exclusion campaigns, malicious mockery, persistent hostility.
- "HARASSMENT": Stalking, abusive name-calling, non-consensual sexualized comments.
- "SEXUAL_GROOMING_OR_PREDATORY": Age-inappropriate sexual solicitation, asking minors for private photos/snapchat/DMs, covert meetup proposals, sexualizing teenagers.
- "SELF_HARM": Encouraging suicide ("kys"), self-harm ideation, suicide pacts.
- "HATE_SPEECH": Slurs or dehumanizing attacks based on race, religion, gender, sexual orientation, disability.
- "SEVERE_PROFANITY_OR_ABUSE": Repeated aggressive profanity, bypass attempts (leetspeak/spaced out vulgarities).
- "DOXXING_OR_PII": Leaking real names, addresses, phone numbers, school locations, private photos.

Severities & Non-Strict Actions:
- "NONE": No action required. Recommended action: "ALLOW".
- "LOW": Mild infraction. Recommended action: "WARN".
- "MEDIUM": Moderate violation (toxic harassment, vulgar evasion). Recommended action: "DELETE".
- "HIGH": Severe violation (hate speech, vicious cyberbullying, doxxing). Recommended action: "DELETE".
- "CRITICAL": High safety risk (predatory grooming, malicious threats). Recommended action: "TIMEOUT_1H" (immediate moderator ping). DO NOT recommend "BAN".

Output structured JSON strictly matching the provided schema.`
};
