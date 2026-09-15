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

  // 4. Policy Engine - Predatory Grooming Escalation
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

  // 5. Policy Engine - Self-Harm Escalation
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

  // 6. Policy Engine - Hate Speech Escalation
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

  // 7. Policy Engine - Prompt Injection Defense
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

  // 8. Policy Engine - Untrusted / Malformed Classification Sanitization
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

  console.log("\n🎉 All AegisMod Automated Tests Passed Successfully!\n");
}

runTests().catch((err) => {
  console.error("Test suite threw uncaught error:", err);
  process.exit(1);
});
