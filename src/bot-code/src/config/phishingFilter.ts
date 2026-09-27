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
   * Helper to check if a domain is a legitimate official Discord domain
   */
  public isLegitimateDiscordDomain(domainOrUrl: string): boolean {
    const lower = domainOrUrl.toLowerCase().trim();
    return (
      lower === "discord.com" ||
      lower === "discordapp.com" ||
      lower === "discordapp.net" ||
      lower === "discord.gg" ||
      lower === "discord.media" ||
      lower === "discordstatus.com" ||
      lower.endsWith(".discord.com") ||
      lower.endsWith(".discordapp.com") ||
      lower.endsWith(".discordapp.net")
    );
  }

  /**
   * Scans a string for malicious links or unauthorized server invites
   */
  public checkContent(content: string, currentGuildId?: string): PhishingCheckResult {
    const trimmed = (content || "").trim();
    if (!trimmed) {
      return { isMalicious: false, type: "NONE" };
    }

    // Strip code blocks (```...```), inline backticks (`...`), quotes (> ...), and outer brackets [ ... ]
    let cleanContent = trimmed
      .replace(/^```[a-z]*\n?/i, "")
      .replace(/```$/, "")
      .replace(/^`|`$/g, "")
      .replace(/^>\s*/gm, "")
      .replace(/^[\[\(<]+|[\]\)>]+$/g, "")
      .trim();

    // 0. Whitelist recognized safe GIF platforms and official Discord CDN / media URLs
    const safeMediaRegex = /(?:https?:\/\/)?(?:[a-zA-Z0-9.-]+\.)?(?:tenor\.com|giphy\.com|imgur\.com)\/[^\s]+|(?:https?:\/\/)?(?:cdn\.discordapp\.com|media\.discordapp\.net|([a-z0-9-]+\.)?discordapp\.com|([a-z0-9-]+\.)?discord\.com)\/(?:attachments|emojis|avatars|icons|app-assets|stickers|banners|discovery-splashes)\/[^\s]+|(?:https?:\/\/)[^\s]+\.(?:gif|mp4|webm|mov|png|jpe?g|webp)(?=[?#\s]|$)/gi;

    // If message is purely a safe media link, attachment, or GIF
    const textWithoutMedia = cleanContent.replace(safeMediaRegex, "").replace(/[\[\]`]/g, "").trim();
    if (!textWithoutMedia || /^[\s\p{Emoji}\[\]`]+$/u.test(textWithoutMedia)) {
      return { isMalicious: false, type: "NONE" };
    }

    // Work on text with safe Discord CDN media links removed to prevent false positives from attachment paths
    const textToScan = textWithoutMedia;
    const lower = textToScan.toLowerCase();

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
      const match = textToScan.match(pattern);
      if (match) {
        const matchedStr = match[0].toLowerCase();
        // Explicitly safeguard legitimate Discord domains (discord.com, discordapp.com, etc.)
        if (this.isLegitimateDiscordDomain(matchedStr)) {
          continue;
        }

        return {
          isMalicious: true,
          type: "PHISHING_NITRO",
          matchedDomain: match[0],
          reason: `Detected deceptive phishing / scam domain: ${match[0]}`,
        };
      }
    }

    // 3. Check unauthorized Discord invite links
    const inviteMatch = textToScan.match(/(?:https?:\/\/)?(?:www\.)?(?:discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9_-]+)/i);
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
