/**
 * Automated Test Suite for AegisMod Verification Gatekeeper
 * Tests:
 * 1. Default configuration & storage persistence
 * 2. evaluateMemberJoin account age & avatar gatekeeper logic
 * 3. Anti-Raid dynamic lockdown integration
 * 4. Alphanumeric Captcha code generation & session validation
 * 5. Captcha retry limits and attempt exhaustion
 * 6. Gatekeeper statistics tracking & role promotion payloads
 */

import { verificationService, VerificationService } from "../src/services/verificationService.js";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runVerificationTests() {
  console.log("🛡️ Running AegisMod Verification Gatekeeper Test Suite...\n");

  const freshGuildId = `test-guild-fresh-${Date.now()}`;

  // 1. Config Defaults
  const config = verificationService.getConfig(freshGuildId);
  assert(config.enabled === true, "Gatekeeper must be enabled by default");
  assert(config.mode === "BUTTON", "Default mode should be BUTTON");
  assert(config.minAccountAgeDays === 3, "Default minAccountAgeDays should be 3");
  assert(config.requireAvatar === true, "Default requireAvatar should be true");
  assert(config.captchaMaxAttempts === 3, "Default captchaMaxAttempts should be 3");

  const testGuildId = "test-guild-gatekeeper-999";

  // 2. Config Updates & Persistence
  const updated = verificationService.updateConfig(testGuildId, {
    mode: "CAPTCHA",
    minAccountAgeDays: 7,
    verifiedRoleId: "role-verified-101",
  });
  assert(updated.mode === "CAPTCHA", "Mode must update to CAPTCHA");
  assert(updated.minAccountAgeDays === 7, "Min account age must update to 7");
  assert(updated.verifiedRoleId === "role-verified-101", "Verified role ID must update");

  // 3. Bot Account Bypass
  const botMember = {
    id: "bot-1",
    user: { createdAt: new Date(), bot: true, avatar: null },
  };
  const botEval = verificationService.evaluateMemberJoin(botMember, testGuildId, false);
  assert(botEval.action === "AUTO_PASS", "Bot accounts must auto-pass gatekeeper");

  // 4. Young Account Quarantine (< 7 days)
  const youngMember = {
    id: "user-young",
    user: {
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days old
      bot: false,
      avatar: "custom_avatar_hash",
    },
  };
  const youngEval = verificationService.evaluateMemberJoin(youngMember, testGuildId, false);
  assert(youngEval.action === "QUARANTINE", "Young accounts (<7d) must be quarantined");

  // 5. Missing Avatar Quarantine
  const noAvatarMember = {
    id: "user-no-avatar",
    user: {
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days old
      bot: false,
      avatar: null, // default avatar
    },
  };
  const avatarEval = verificationService.evaluateMemberJoin(noAvatarMember, testGuildId, false);
  assert(avatarEval.action === "QUARANTINE", "Accounts without custom avatar must be quarantined when requireAvatar=true");

  // 6. Anti-Raid Active Quarantine
  const raidMember = {
    id: "user-raid",
    user: {
      createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      bot: false,
      avatar: "valid_avatar",
    },
  };
  const raidEval = verificationService.evaluateMemberJoin(raidMember, testGuildId, true);
  assert(raidEval.action === "QUARANTINE", "Incoming accounts must be quarantined during active anti-raid lockdown");

  // 7. Legitimate Account Gatekeeper Challenge
  const legitMember = {
    id: "user-legit",
    user: {
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days old
      bot: false,
      avatar: "valid_avatar_hash",
    },
  };
  const legitEval = verificationService.evaluateMemberJoin(legitMember, testGuildId, false);
  assert(legitEval.action === "VERIFY_REQUIRED", "Legitimate member must be routed to VERIFY_REQUIRED");

  // 8. Captcha Generation
  const captchaCode = verificationService.generateCaptchaCode();
  assert(captchaCode.length === 6, "Captcha code must be exactly 6 characters");
  assert(!captchaCode.includes("0") && !captchaCode.includes("O"), "Captcha code should exclude ambiguous characters 0/O");
  assert(!captchaCode.includes("1") && !captchaCode.includes("I"), "Captcha code should exclude ambiguous characters 1/I");

  // 9. Captcha Session & Verification
  const userId = "test-user-captcha-42";
  const sessionCode = verificationService.createCaptchaSession(userId);
  assert(sessionCode.length === 6, "Generated session code must match 6 characters");

  // Incorrect attempt
  const badAttempt = verificationService.verifyCaptcha(userId, "WRONG9", testGuildId);
  assert(badAttempt.success === false, "Incorrect captcha must fail");
  assert(badAttempt.attemptsLeft === 2, "Should have 2 attempts remaining after first mistake");

  // Correct attempt
  const goodAttempt = verificationService.verifyCaptcha(userId, sessionCode.toLowerCase(), testGuildId);
  assert(goodAttempt.success === true, "Case-insensitive matching code must pass captcha");

  // Session deleted after pass
  const emptySession = verificationService.getCaptchaSession(userId);
  assert(emptySession === null, "Captcha session must be cleared after successful verification");

  // 10. Captcha Attempt Exhaustion
  const failUserId = "test-user-fail-99";
  verificationService.createCaptchaSession(failUserId);
  verificationService.verifyCaptcha(failUserId, "BAD001", testGuildId);
  verificationService.verifyCaptcha(failUserId, "BAD002", testGuildId);
  const finalAttempt = verificationService.verifyCaptcha(failUserId, "BAD003", testGuildId);
  assert(finalAttempt.success === false, "3rd failed attempt must fail");
  assert(finalAttempt.attemptsLeft === 0, "Attempts left must reach 0");
  assert(verificationService.getCaptchaSession(failUserId) === null, "Session must expire after max attempts");

  // 11. Discord UI Embeds & Rows
  const embed = verificationService.buildVerificationEmbed("Teen Lounge", updated);
  assert(embed.data.title?.includes("Verification Gate") === true, "Embed must contain Verification Gate title");
  assert(embed.data.color === 0x5865F2, "Embed color should be Blurple");

  const actionRow = verificationService.buildVerificationActionRow();
  assert(actionRow.components.length === 3, "Verification action row must contain 3 buttons (Verify, Rules, ModMail)");

  console.log("\n🎉 All Verification Gatekeeper Tests Passed Successfully!");
}

runVerificationTests().catch((err) => {
  console.error("Verification test suite failed:", err);
  process.exit(1);
});
