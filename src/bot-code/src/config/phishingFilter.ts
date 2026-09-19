/**
 * Phishing & Malicious Link Protection Filter
 * Detects Discord Nitro scams, fake steam giveaways, token grabbers, IP loggers,
 * and unauthorized Discord server invite spam.
 */

export interface PhishingCheckResult {
  isMalicious: boolean;
  type: "NONE" | "PHISHING_NITRO" | "TOKEN_GRABBER" | "UNAUTHORIZED_INVITE" | "MALICIOUS_SHORTENER";
  matchedDomain?: string;
  reason?: string;
}

export class PhishingFilter {
  // Known scam patterns (typosquats, fake nitro, fake steam)
  private readonly suspiciousDomainPatterns: RegExp[] = [
    /(?:d[il1]sc[o0]rd|d[il1]sc[o0]rld|d[il1]csord|discorcd|discorde|discord-app|discord-gift|discord-nitro|dlscord)[^.\s]*\.(?:com|org|net|xyz|ru|link|gift|info|club|gg|app)/i,
    /(?:steamc[o0]mmun[il1]ty|steam-gift|steam-nitro|steamcommunlty)\.(?:com|ru|org|xyz|net)/i,
    /(?:free-nitro|boost-nitro|airdrop-nitro|get-nitro|discordnitro)\.(?:com|org|xyz|net|link)/i,
  ];

  // Known IP loggers & malicious link shorteners
  private readonly tokenGrabberDomains = new Set([
    "grabify.link",
    "iplogger.org",
    "iplogger.com",
    "blasze.com",
    "yip.su",
    "2no.co",
    "iplogger.ru",
    "ps3cfw.com",
    "leancoding.co",
  ]);

  // Allowed Discord server invite codes per guild: guildId -> Set of allowed codes/guildIds
  private allowedInvites = new Map<string, Set<string>>();

  constructor() {
    // Default global safe invites can be added here
  }

  public allowInvite(guildId: string, inviteCode: string) {
    const list = this.allowedInvites.get(guildId) || new Set<string>();
    list.add(inviteCode.toLowerCase().trim());
    this.allowedInvites.set(guildId, list);
  }

  public isInviteAllowed(guildId: string, inviteCode: string): boolean {
    const list = this.allowedInvites.get(guildId);
    return list ? list.has(inviteCode.toLowerCase().trim()) : false;
  }

  /**
   * Scans a string for malicious links or unauthorized server invites
   */
  public checkContent(content: string, currentGuildId?: string): PhishingCheckResult {
    const lower = content.toLowerCase();

    // 0. Whitelist recognized safe GIF platforms (Tenor, Giphy, Discord media/cdn)
    const isPureSafeGif = /^(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+\.)?(?:tenor\.com|giphy\.com)\/[^\s]+$/i.test(content.trim());
    if (isPureSafeGif) {
      return { isMalicious: false, type: "NONE" };
    }

    // 1. Check token grabbers & IP loggers
    for (const domain of this.tokenGrabberDomains) {
      if (lower.includes(domain)) {
        return {
          isMalicious: true,
          type: "TOKEN_GRABBER",
          matchedDomain: domain,
          reason: `Detected known malicious IP logger / token grabber link: ${domain}`,
        };
      }
    }

    // 2. Check phishing regex patterns
    for (const pattern of this.suspiciousDomainPatterns) {
      const match = content.match(pattern);
      if (match) {
        return {
          isMalicious: true,
          type: "PHISHING_NITRO",
          matchedDomain: match[0],
          reason: `Detected deceptive phishing / scam domain: ${match[0]}`,
        };
      }
    }

    // 3. Check unauthorized Discord invite links
    const inviteMatch = content.match(/(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
    if (inviteMatch) {
      const code = inviteMatch[1];
      if (currentGuildId && this.isInviteAllowed(currentGuildId, code)) {
        // Whitelisted partner server invite
        return { isMalicious: false, type: "NONE" };
      }
      return {
        isMalicious: true,
        type: "UNAUTHORIZED_INVITE",
        matchedDomain: inviteMatch[0],
        reason: `External Discord server invite detected (${code}). Unsolicited advertising is prohibited.`,
      };
    }

    return { isMalicious: false, type: "NONE" };
  }
}

export const PHISHING_FILTER = new PhishingFilter();
