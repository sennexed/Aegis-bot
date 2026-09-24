/**
 * Multilingual Cuss Words & Local Speech Filter Unit Tests
 * Validates zero-token interception for Hindi, Russian, Arabic, and other local speech
 */

import { PROFANITY_FILTER } from "../src/config/profanityFilter.js";
import { AutoModService } from "../src/services/autoModService.js";

console.log("🧪 Starting Multilingual Profanity & Speech Filter Test Suite...\n");

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

// 1. Hindi / Hinglish Tests
const hindiHinglish1 = PROFANITY_FILTER.checkProfanity("Hey bro why are you acting like a madarchod?");
assert(hindiHinglish1 !== null && hindiHinglish1.severity === "HIGH" && hindiHinglish1.language.includes("Hindi"), 
  "Catch Hinglish severe insult 'madarchod'");

const hindiHinglish2 = PROFANITY_FILTER.checkProfanity("stop this bsdk right now");
assert(hindiHinglish2 !== null && hindiHinglish2.language.includes("Hindi"), 
  "Catch Hinglish abbreviation 'bsdk'");

const hindiHinglish3 = PROFANITY_FILTER.checkProfanity("abe saale chutiya hai kya tu");
assert(hindiHinglish3 !== null && hindiHinglish3.word.includes("chutiya"), 
  "Catch Hinglish insult 'chutiya'");

const hindiDevanagari1 = PROFANITY_FILTER.checkProfanity("तुम एक नंबर के चूतिया हो");
assert(hindiDevanagari1 !== null && hindiDevanagari1.language.includes("Devanagari"), 
  "Catch Hindi Devanagari 'चूतिया'");

const hindiDevanagari2 = PROFANITY_FILTER.checkProfanity("मादरचोद बकवास बंद कर");
assert(hindiDevanagari2 !== null && hindiDevanagari2.severity === "HIGH", 
  "Catch Hindi Devanagari 'मादरचोद'");

// 2. Russian & Mat Tests
const russianCyrillic1 = PROFANITY_FILTER.checkProfanity("ты сука блять тупой");
assert(russianCyrillic1 !== null && russianCyrillic1.language.includes("Russian"), 
  "Catch Russian Cyrillic 'сука блять'");

const russianCyrillic2 = PROFANITY_FILTER.checkProfanity("пошел нахуй отсюда");
assert(russianCyrillic2 !== null && russianCyrillic2.language.includes("Russian"), 
  "Catch Russian Cyrillic 'нахуй'");

const russianRomanized1 = PROFANITY_FILTER.checkProfanity("rush b cyka blyat noob");
assert(russianRomanized1 !== null && russianRomanized1.language.includes("Russian"), 
  "Catch Romanized Russian Mat 'cyka blyat'");

const russianRomanized2 = PROFANITY_FILTER.checkProfanity("idi nahuy stupid feeder");
assert(russianRomanized2 !== null && russianRomanized2.language.includes("Russian"), 
  "Catch Romanized Russian Mat 'idi nahuy'");

// 3. Arabic & Arabizi Tests
const arabicScript1 = PROFANITY_FILTER.checkProfanity("يا ابن الكلب اخرج من السيرفر");
assert(arabicScript1 !== null && arabicScript1.language.includes("Arabic"), 
  "Catch Arabic script 'ابن الكلب'");

const arabicScript2 = PROFANITY_FILTER.checkProfanity("يا شرموطة");
assert(arabicScript2 !== null && arabicScript2.language.includes("Arabic"), 
  "Catch Arabic script 'شرموطة'");

const arabicArabizi1 = PROFANITY_FILTER.checkProfanity("kos omk ya hmar");
assert(arabicArabizi1 !== null && arabicArabizi1.language.includes("Arabic"), 
  "Catch Arabizi 'kos omk'");

const arabicArabizi2 = PROFANITY_FILTER.checkProfanity("kol 5ara and leave");
assert(arabicArabizi2 !== null && arabicArabizi2.language.includes("Arabic"), 
  "Catch Franco-Arabic Arabizi '5ara'");

// 4. Spanish & Other Tests
const spanish1 = PROFANITY_FILTER.checkProfanity("hijo de puta no sabes jugar");
assert(spanish1 !== null && spanish1.language === "Spanish", 
  "Catch Spanish 'hijo de puta'");

// 5. Safe Chat & Benign False Positive Checks
const cleanBanter = PROFANITY_FILTER.checkProfanity("ggwp that was an awesome clutch bro!");
assert(cleanBanter === null, 
  "Clean casual gamer chat must NOT be flagged");

const wordPass = PROFANITY_FILTER.checkProfanity("can you please pass the glass to the assistant?");
assert(wordPass === null, 
  "Substrings in innocent words (pass, glass, assistant) must NOT trigger 'ass'");

// 6. AutoModService Integration Check
const autoMod = new AutoModService();
const autoModHindi = autoMod.checkContent("tum ek bhenchod ho", "user-1", "guild-1");
assert(autoModHindi.triggered === true && autoModHindi.ruleName?.includes("Hindi"), 
  "AutoModService intercepts Hinglish abuse and attributes language");

const autoModRussian = autoMod.checkContent("пошел нахуй", "user-2", "guild-1");
assert(autoModRussian.triggered === true && autoModRussian.ruleName?.includes("Russian"), 
  "AutoModService intercepts Russian Cyrillic and attributes language");

const autoModArabic = autoMod.checkContent("kos omk get out", "user-3", "guild-1");
assert(autoModArabic.triggered === true && autoModArabic.ruleName?.includes("Arabic"), 
  "AutoModService intercepts Arabizi and attributes language");

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, ${failed} failed.`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
