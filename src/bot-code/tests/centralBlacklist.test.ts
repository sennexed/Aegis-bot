/**
 * Central Blacklist Service Unit Tests
 * Validates JSON-based multi-lingual blacklist management and pre-Gemini prioritization
 */

import { centralBlacklistService } from "../src/services/centralBlacklistService.js";
import { PROFANITY_FILTER } from "../src/config/profanityFilter.js";

console.log("🧪 Starting Central Blacklist Service Test Suite...\n");

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Initial State & Metadata
const metadata = centralBlacklistService.getMetadata();
assert(metadata.totalTerms > 50, `Initial terms loaded (>50): got ${metadata.totalTerms}`);
assert(metadata.languages.some(l => l.includes("Hindi")), "Includes Hindi language coverage");
assert(metadata.languages.some(l => l.includes("Russian")), "Includes Russian language coverage");
assert(metadata.languages.some(l => l.includes("Arabic")), "Includes Arabic language coverage");

// 2. Test Content - Pre-Gemini Priority Intercept
const testHindi = centralBlacklistService.testContent("kya hal hai bhenchod");
assert(testHindi.matched === true, "Hindi Hinglish 'bhenchod' matched");
assert(testHindi.triageStage === "TIER_1_LOCAL_INTERCEPT", "Flagged at TIER_1_LOCAL_INTERCEPT before Gemini");
assert(testHindi.tokensConsumed === 0, "Consumes 0 tokens (bypasses Gemini)");

const testRussian = centralBlacklistService.testContent("ты сука idiot");
assert(testRussian.matched === true, "Russian Cyrillic 'сука' matched");
assert(testRussian.tokensSaved === 420, "Records 420 tokens saved on Russian intercept");

const testArabic = centralBlacklistService.testContent("shut up kos omk");
assert(testArabic.matched === true, "Arabic Arabizi 'kos omk' matched");
assert(testArabic.severity === "HIGH", "Arabic slur marked HIGH severity");

const testBenign = centralBlacklistService.testContent("ggwp that was a good match");
assert(testBenign.matched === false, "Benign chat passes blacklist");
assert(testBenign.triageStage === "TIER_3_GEMINI_DEEP_EVALUATION", "Benign chat routed through standard evaluation");

// 3. Dynamic Add Term & Instant Sync
const customTerm = centralBlacklistService.addTerm({
  term: "bakwaasbaazi99",
  language: "Hindi (Hinglish)",
  severity: "HIGH",
  category: "SEVERE_PROFANITY_OR_ABUSE",
  isPhrase: false,
  enabled: true,
  notes: "Test offensive term",
});
assert(customTerm.id.startsWith("bl-"), "Generates valid blacklist ID");

// Verify PROFANITY_FILTER in memory immediately has it
const checkDynamic = PROFANITY_FILTER.checkProfanity("stop this bakwaasbaazi99 right now");
assert(checkDynamic !== null && checkDynamic.word === "bakwaasbaazi99", "PROFANITY_FILTER immediately recognizes dynamically added term");

// 4. Toggle Term
centralBlacklistService.toggleTerm(customTerm.id);
const checkDisabled = PROFANITY_FILTER.checkProfanity("stop this bakwaasbaazi99 right now");
assert(checkDisabled === null, "Disabled term is ignored by live filter");

// Re-enable
centralBlacklistService.toggleTerm(customTerm.id);
const checkReenabled = PROFANITY_FILTER.checkProfanity("stop this bakwaasbaazi99 right now");
assert(checkReenabled !== null, "Re-enabled term is actively filtered again");

// Clean up test term
centralBlacklistService.deleteTerm(customTerm.id);
const checkDeleted = PROFANITY_FILTER.checkProfanity("stop this bakwaasbaazi99 right now");
assert(checkDeleted === null, "Deleted term successfully removed from filter");

// 5. JSON Document Generation
const jsonDoc = centralBlacklistService.getJsonDocument();
assert(jsonDoc.version === "2.1.0", "JSON schema has version 2.1.0");
assert(Array.isArray(jsonDoc.terms), "JSON schema has terms array");
assert(jsonDoc.terms.length > 50, "JSON schema contains all terms");

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
