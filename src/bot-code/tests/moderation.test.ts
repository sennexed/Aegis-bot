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

  // 11. Policy Engine - AutoMod Phishing Escalation
  const phishingPolicy = PolicyEngine.evaluatePolicy({
    flagged: true,
    category: "PHISHING_OR_SCAM",
    severity: "CRITICAL",
    confidence: 1.0,
    reason: "Phishing link detected",
    highlightedPhrases: ["discrod-app.gift"],
  }, "Test Server");
  assert(
    phishingPolicy.action === "TIMEOUT_24H" && phishingPolicy.requiresStaffNotification === true,
    "PolicyEngine must map PHISHING_OR_SCAM to 24h timeout and notify staff"
  );

  // 12. Policy Engine - Predatory Grooming Escalation
  const groomingClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "SEXUAL_GROOMING_OR_PREDATORY",
    severity: "CRITICAL",
    confidence: 0.98,
    reason: "Minor solicitation detected",
  });
  const groomingDecision = PolicyEngine.evaluatePolicy(groomingClass, "Test Server");
  assert(
    groomingDecision.action === "BAN" && groomingDecision.requiresStaffNotification === true,
    "PolicyEngine must immediately map SEXUAL_GROOMING_OR_PREDATORY to BAN with staff alert"
  );

  // 13. Policy Engine - Self-Harm Escalation
  const selfHarmClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "SELF_HARM",
    severity: "CRITICAL",
    confidence: 0.99,
    reason: "Suicide incitement",
  });
  const selfHarmDecision = PolicyEngine.evaluatePolicy(selfHarmClass, "Test Server");
  assert(
    selfHarmDecision.action === "TIMEOUT_24H" && selfHarmDecision.requiresStaffNotification === true,
    "PolicyEngine must map SELF_HARM to TIMEOUT_24H and alert staff"
  );

  // 14. Policy Engine - Hate Speech Escalation
  const hateClass: ModerationClassification = PolicyEngine.validateClassification({
    flagged: true,
    category: "HATE_SPEECH",
    severity: "HIGH",
    confidence: 0.95,
    reason: "Targeted ethnic slur",
  });
  const hateDecision = PolicyEngine.evaluatePolicy(hateClass, "Test Server");
  assert(
    hateDecision.action === "TIMEOUT_1H" && hateDecision.requiresStaffNotification === true,
    "PolicyEngine must map HIGH hate speech to TIMEOUT_1H with staff notification"
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

  console.log("\n🎉 All 18 AegisMod Automated Tests Passed Successfully!\n");
}

runTests().catch((err) => {
  console.error("Test suite threw uncaught error:", err);
  process.exit(1);
});
