/**
 * Test Suite for AegisMod
 * Tests:
 * 1. TriageService (benign slang fast filters, token saving)
 * 2. TriageService (Tier-2 zero-tolerance regex triggering)
 * 3. PolicyEngine (strict teen safety deterministic escalation matrix)
 * 4. PolicyEngine (neutralization of prompt injection / invalid inputs)
 * 5. RoleService (hierarchy permission matrix)
 */

import { TriageService } from "../src/services/triageService.js";
import { PolicyEngine, ModerationClassification } from "../src/services/policyEngine.js";
import { AutoModService } from "../src/services/autoModService.js";
import { GeminiModerationService } from "../src/services/geminiModerationService.js";
import { PHISHING_FILTER } from "../src/config/phishingFilter.js";
import { newsService } from "../src/services/newsService.js";
import { FAMOUS_NEWS_SOURCES } from "../src/data/newsSources.js";
import { autoNewsBotService } from "../src/services/autoNewsBotService.js";
import { botNameStylesService } from "../src/services/botNameStylesService.js";
import { BOT_NAME_FONTS, BOT_NAME_EFFECTS, BOT_COLOR_PRESETS, hexToDiscordDecimal } from "../src/types/nameStyles.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTests() {
  console.log("\n🧪 Running AegisMod Automated Validation Suite...\n");

  // 1. Triage Service Fast Filters
  const triage = new TriageService();

  const benignCases = ["gg", "lol", "nice clutch bro", "yo whatsup", "no cap fr"];
  for (const text of benignCases) {
    const res = triage.evaluate(text);
    assert(
      !res.shouldCallGemini && res.localVerdict?.flagged === false,
      `Triage should filter benign message "${text}" without calling Gemini (0 tokens)`
    );
  }

  // 2. Triage Zero-Tolerance Regex (Self Harm)
  const selfHarm = triage.evaluate("kys right now");
  assert(
    !selfHarm.shouldCallGemini && selfHarm.localVerdict?.flagged === true && selfHarm.localVerdict?.category === "SELF_HARM",
    "Triage should intercept self-harm instantly at Tier-2 without waiting for Gemini API"
  );

  // 3. Triage Zero-Tolerance Regex (Predatory solicitation)
  const predatory = triage.evaluate("send me nudes or meet up in person secretly");
  assert(
    !predatory.shouldCallGemini && predatory.localVerdict?.flagged === true && predatory.localVerdict?.category === "SEXUAL_GROOMING_OR_PREDATORY",
    "Triage should intercept predatory solicitation instantly at Tier-2"
  );

  // 4. Standard AutoMod - Anti-Invite Link
  const autoMod = new AutoModService();
  const inviteCheck = autoMod.checkContent("Join my cool server: discord.gg/hacked123", "user1", "guild1");
  assert(
    inviteCheck.triggered === true && inviteCheck.category === "INVITE_LINK_SPAM",
    "AutoMod must catch unauthorized discord.gg invite links"
  );

  // 5. Standard AutoMod - Anti-Phishing Scam Link
  const phishingCheck = autoMod.checkContent("Free Nitro for everyone click here: http://discrod-app.gift/claim", "user2", "guild1");
  assert(
    phishingCheck.triggered === true && phishingCheck.category === "PHISHING_OR_SCAM",
    "AutoMod must detect phishing/scam lookalike domains"
  );

  // 6. Standard AutoMod - Anti-Mass Mention
  const mentionCheck = autoMod.checkContent("hello @user1 @user2 @user3 @user4 @user5 @user6", "user3", "guild1", 6);
  assert(
    mentionCheck.triggered === true && mentionCheck.category === "MASS_MENTION_SPAM",
    "AutoMod must intercept mass mentions exceeding threshold"
  );

  // 7. Standard AutoMod - Anti-Spam / Rapid Message Flood
  // User sends 6 messages quickly
  let floodTriggered = false;
  for (let i = 0; i < 6; i++) {
    const floodCheck = autoMod.checkContent(`rapid message payload ${i}`, "spammer_user", "guild1");
    if (floodCheck.triggered && floodCheck.category === "FLOOD_OR_SPAM") {
      floodTriggered = true;
      break;
    }
  }
  assert(floodTriggered, "AutoMod sliding window must trigger FLOOD_OR_SPAM on rapid message bursts");

  // 8. Standard AutoMod - Anti-Excessive Caps
  const capsCheck = autoMod.checkContent("HEY EVERYONE STOP TALKING AND LOOK AT THIS RIGHT NOW PLEASE", "user4", "guild1");
  assert(
    capsCheck.triggered === true && capsCheck.category === "EXCESSIVE_CAPS",
    "AutoMod must catch messages with excessive uppercase text"
  );

  // 9. Standard AutoMod - Anti-Zalgo / Glitch Text
  const zalgoCheck = autoMod.checkContent("h̷̛̰ḛ̸̡l̵̡̰l̵̡̰o̵̡̰ t̷̛̰h̷̛̰ḛ̸̡r̸̡̰ḛ̵̡", "user5", "guild1");
  assert(
    zalgoCheck.triggered === true && zalgoCheck.category === "GLITCH_OR_ZALGO",
    "AutoMod must catch zalgo glitch combining mark text"
  );

  // 10. Standard AutoMod - Zero-Tolerance Banned Word
  const slurCheck = autoMod.checkContent("You are a f@ggot", "user6", "guild1");
  assert(
    slurCheck.triggered === true && slurCheck.category === "HATE_SPEECH",
    "AutoMod must instantly catch leetspeak obfuscated hate slurs"
  );

  // 11. Policy Engine - AutoMod Phishing Escalation (Non-Strict: 1h Cooldown, No 24h)
  const phishingPolicy = PolicyEngine.evaluatePolicy({
    flagged: true,
    category: "PHISHING_OR_SCAM",
    severity: "CRITICAL",
    confidence: 1.0,
    reason: "Phishing link detected",
    highlightedPhrases: ["discrod-app.gift"],
  }, "Test Server");
  assert(
    phishingPolicy.action === "TIMEOUT_1H" && phishingPolicy.requiresStaffNotification === true,
    "PolicyEngine must map PHISHING_OR_SCAM to 1h cooldown timeout and notify staff"
  );

  // 12. Policy Engine - Predatory Grooming Escalation (Non-Strict: 1H Cooldown Review, No Permanent Ban)
  const groomingClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "SEXUAL_GROOMING_OR_PREDATORY",
    severity: "CRITICAL",
    confidence: 0.98,
    reason: "Minor solicitation detected",
  });
  const groomingDecision = PolicyEngine.evaluatePolicy(groomingClass, "Test Server");
  assert(
    groomingDecision.action === "TIMEOUT_1H" && groomingDecision.requiresStaffNotification === true,
    "PolicyEngine must immediately map SEXUAL_GROOMING_OR_PREDATORY to TIMEOUT_1H with staff alert (no permanent bans)"
  );

  // 13. Policy Engine - Self-Harm Escalation (Supportive non-strict: Message Deletion + Compassionate Helpline)
  const selfHarmClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "SELF_HARM",
    severity: "CRITICAL",
    confidence: 0.99,
    reason: "Suicide incitement",
  });
  const selfHarmDecision = PolicyEngine.evaluatePolicy(selfHarmClass, "Test Server");
  assert(
    selfHarmDecision.action === "DELETE" && selfHarmDecision.requiresStaffNotification === true,
    "PolicyEngine must map SELF_HARM to DELETE with crisis guidance and alert staff"
  );

  // 14. Policy Engine - Hate Speech Escalation (Non-Strict: Delete message, no harsh timeout)
  const hateClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "HATE_SPEECH",
    severity: "HIGH",
    confidence: 0.95,
    reason: "Targeted ethnic slur",
  });
  const hateDecision = PolicyEngine.evaluatePolicy(hateClass, "Test Server");
  assert(
    hateDecision.action === "DELETE" && hateDecision.requiresStaffNotification === true,
    "PolicyEngine must map HIGH hate speech to DELETE with staff notification"
  );

  // 15. Policy Engine - Prompt Injection Defense
  const injectionClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "PROMPT_INJECTION_OR_JAILBREAK",
    severity: "HIGH",
    confidence: 0.9,
    reason: "Attempted to override system instructions",
  });
  const injectionDecision = PolicyEngine.evaluatePolicy(injectionClass, "Test Server");
  assert(
    injectionDecision.action === "DELETE" && injectionDecision.requiresStaffNotification === true,
    "PolicyEngine must delete prompt injection attempts and notify staff"
  );

  // 16. Policy Engine - Untrusted / Malformed Classification Sanitization
  const bogusClass = PolicyEngine.validateClassification({
    flagged: "yes",
    category: "RANDOM_HACKED_CATEGORY",
    severity: "SUPER_DUPER",
    confidence: 9999,
  });
  const bogusDecision = PolicyEngine.evaluatePolicy(bogusClass, "Test Server");
  assert(
    bogusDecision.action === "ALLOW",
    "PolicyEngine must safely reject and sanitize unauthorized classifications to ALLOW"
  );

  // 17. GeminiModerationService - Heuristic Fallback Resilience
  const geminiFallback = new GeminiModerationService(""); // No API key -> must gracefully fall back
  const fallbackResult = await geminiFallback.analyzeMessage("kys right now", "BadUser");
  assert(
    fallbackResult.flagged === true && fallbackResult.category === "SELF_HARM",
    "GeminiModerationService must catch severe safety violations even when API key is missing or offline"
  );

  // 18. Profanity Filter Integration
  const profanityCheck = autoMod.checkContent("You are an asshole and dumbass", "user1", "guild1");
  assert(
    profanityCheck.triggered === true && profanityCheck.category === "SEVERE_PROFANITY_OR_ABUSE",
    "AutoMod must catch severe abusive profanity using PROFANITY_FILTER"
  );

  // 19. Safe GIF Exemption - Tenor, Giphy & Discord Media URLs
  const tenorGifCheck = autoMod.checkContent("https://tenor.com/view/spongebob-dancing-happy-gif-20512833", "gif_user1", "guild1");
  assert(
    tenorGifCheck.triggered === false,
    "AutoMod must allow Tenor GIF links without triggering profanity or phishing false positives"
  );

  const giphyGifCheck = autoMod.checkContent("https://giphy.com/gifs/cat-cute-funny-3o7TKMGpxxcaenA42A", "gif_user2", "guild1");
  assert(
    giphyGifCheck.triggered === false,
    "AutoMod must allow Giphy GIF links without triggering profanity or phishing false positives"
  );

  // 20. GIF URL with slug containing potentially matching substring (e.g. 'anal' in analysis/banana)
  const safeGifWithSlug = autoMod.checkContent("https://tenor.com/view/data-analysis-chart-gif-12345", "gif_user3", "guild1");
  assert(
    safeGifWithSlug.triggered === false,
    "AutoMod must exempt GIF URL slugs from triggering profanity substrings"
  );

  // 21. Phishing Filter Safe GIF Whitelist
  const phishingGifCheck = PHISHING_FILTER.checkContent("https://media.tenor.com/m/abcdef/reaction.gif", "guild1");
  assert(
    phishingGifCheck.isMalicious === false,
    "Phishing filter must whitelist Tenor media domains"
  );

  // 22. AutoNews: Verified Exactly 13 Famous Newspaper Sources
  const expectedSources = [
    "BBC",
    "The New York Times",
    "The Wall Street Journal",
    "The Guardian",
    "The Washington Post",
    "The Times of India",
    "The Yomiuri Shimbun",
    "Le Monde",
    "Financial Times",
    "The Asahi Shimbun",
    "El País",
    "Daily Mail",
    "The Daily Telegraph",
  ];
  assert(
    FAMOUS_NEWS_SOURCES.length === 13,
    `FAMOUS_NEWS_SOURCES must contain exactly 13 newspapers (found ${FAMOUS_NEWS_SOURCES.length})`
  );
  for (const expected of expectedSources) {
    const found = FAMOUS_NEWS_SOURCES.some((s) => s.name === expected);
    assert(found, `FAMOUS_NEWS_SOURCES must include '${expected}'`);
  }

  // 23. AutoNews: Fetch exactly 1 article per newspaper
  const articles = await newsService.fetchAll13Newspapers(false);
  assert(
    articles.length === 13,
    `newsService.fetchAll13Newspapers must return exactly 13 articles (found ${articles.length})`
  );
  const sourceIds = new Set(articles.map((a) => a.sourceId));
  assert(
    sourceIds.size === 13,
    `Each article must originate from a distinct newspaper (found ${sourceIds.size} distinct sources)`
  );

  // 24. AutoNews: Pagination with 5 news per page
  const pageSize = 5;
  const totalPages = Math.ceil(articles.length / pageSize); // 13 / 5 = 3 pages
  assert(
    totalPages === 3,
    `13 articles at 5 per page must yield 3 pages (found ${totalPages})`
  );

  // Page 1: 5 articles
  const embedPage1 = autoNewsBotService.create13NewspapersDigestEmbed(articles, 1, 5);
  const embedData1 = embedPage1.toJSON();
  assert(
    embedData1.fields?.length === 5,
    `Page 1 embed must contain exactly 5 news fields (found ${embedData1.fields?.length})`
  );

  // Page 2: 5 articles
  const embedPage2 = autoNewsBotService.create13NewspapersDigestEmbed(articles, 2, 5);
  const embedData2 = embedPage2.toJSON();
  assert(
    embedData2.fields?.length === 5,
    `Page 2 embed must contain exactly 5 news fields (found ${embedData2.fields?.length})`
  );

  // Page 3: remaining 3 articles
  const embedPage3 = autoNewsBotService.create13NewspapersDigestEmbed(articles, 3, 5);
  const embedData3 = embedPage3.toJSON();
  assert(
    embedData3.fields?.length === 3,
    `Page 3 embed must contain remaining 3 news fields (found ${embedData3.fields?.length})`
  );

  // Pagination buttons row
  const paginationRow = autoNewsBotService.createPaginationRow(1, 3);
  assert(
    paginationRow.components.length === 4,
    "Pagination row must contain 4 interactive components (Prev, Indicator, Next, Refresh)"
  );

  // 10. Bot Name Styles Suite
  console.log("\n✨ Testing Discord Bot Name Styles Catalog & REST API Generator...");

  assert(BOT_NAME_FONTS.length === 12, `Must include exactly 12 Discord fonts (found ${BOT_NAME_FONTS.length})`);
  assert(BOT_NAME_EFFECTS.length === 6, `Must include exactly 6 visual effects (found ${BOT_NAME_EFFECTS.length})`);
  assert(BOT_COLOR_PRESETS.length >= 7, "Must include curated color palettes with decimal conversions");

  // Verify default config
  const defaultCfg = botNameStylesService.getConfig();
  assert(defaultCfg.displayName === "AegisMod", "Default bot display name must be AegisMod");

  // Verify REST API payload creation
  const payload = botNameStylesService.buildDiscordApiPayload(defaultCfg);
  assert(
    payload.name_style &&
    typeof payload.name_style.font_id === "string" &&
    typeof payload.name_style.effect_id === "string" &&
    Array.isArray(payload.name_style.colors),
    "Discord API payload must have name_style object with font_id, effect_id, and colors array"
  );

  // Verify decimal color conversion
  const blurpleDecimal = hexToDiscordDecimal("#5865F2");
  assert(blurpleDecimal === 5793266, `Discord Blurple #5865F2 should convert to decimal 5793266 (got ${blurpleDecimal})`);

  // Verify formatted nickname with clan badge
  const nick = botNameStylesService.formatFormattedNickname(defaultCfg);
  assert(nick.includes("[") && nick.includes("AEGIS"), "Formatted nickname must include clan tag brackets");

  console.log("\n🎉 All 29 AegisMod, AutoNews & Bot Name Styles Automated Tests Passed Successfully!\n");
}

runTests().catch((err) => {
  console.error("Test suite threw uncaught error:", err);
  process.exit(1);
});
