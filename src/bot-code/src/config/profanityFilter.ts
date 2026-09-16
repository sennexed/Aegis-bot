/**
 * Profanity Filter Configuration
 * Comprehensive lists of profanity words organized by severity for instant filtering
 */

export const PROFANITY_FILTER = {
  // HIGH SEVERITY: Immediate BAN or TIMEOUT_24H
  highSeverity: new Set([
    "kys",
    "k.y.s",
    "kill yourself",
    "kill ur self",
    "die in a fire",
    "suicide",
    "send nudes",
    "send me nudes",
    "trade pics",
    "drop snap 16",
    "drop your insta dm",
    "meet up in person secretly",
  ]),

  // MEDIUM SEVERITY: DELETE + TIMEOUT_1H
  // Severe insults, heavy profanity, targeted abuse
  mediumSeverity: new Set([
    "fuck",
    "fucked",
    "fucking",
    "f*ck",
    "f**k",
    "fucker",
    "shit",
    "shitty",
    "asshole",
    "bastard",
    "bitch",
    "bitches",
    "bitchy",
    "cunt",
    "dickhead",
    "dumbass",
    "damn",
    "damned",
    "goddamn",
    "piss",
    "pissed",
    "whore",
    "slut",
    "cock",
    "pussy",
    "dick",
    "anal",
    "anus",
    "arse",
    "arsehole",
    "bollocks",
    "bugger",
    "crap",
    "crappy",
    "fart",
    "feck",
    "frickin",
    "friggin",
    "hell",
    "prick",
    "twat",
    "wank",
    "wanker",
    "sod",
    "tit",
    "tits",
    "tosser",
    "turd",
    "jackass",
    "jerk",
    "moron",
    "retard",
    "retarded",
    "stupid",
    "dumb",
    "idiot",
    "imbecile",
    "dipshit",
    "douche",
    "douchebag",
    "asshat",
    "buttface",
    "clown",
    "cretin",
    "dolt",
    "dunce",
    "goon",
    "halfwit",
    "knobhead",
    "muppet",
    "numpty",
    "oaf",
    "plonker",
    "prat",
    "screwball",
    "simpleton",
    "twirp",
    "wally",
    "bonehead",
    "chump",
    "clod",
    "dope",
    "dweeb",
    "nitwit",
    "numskull",
    "pillock",
    "schmuck",
    "simp",
    "whack",
    "weakling",
    "wimp",
  ]),

  // LOW SEVERITY: DELETE message only, no timeout
  // Mild profanity, minor insults, casual vulgarity
  lowSeverity: new Set([
    "sucks",
    "sucky",
    "lame",
    "gay",
    "sux",
    "poo",
    "pooh",
    "poop",
    "poopy",
    "butt",
    "buttface",
    "butthead",
    "pee",
    "tinkle",
    "boob",
    "boobs",
    "booby",
    "nerd",
    "loser",
    "noob",
    "newbie",
    "dork",
    "geek",
    "freak",
    "weirdo",
    "oddball",
    "wacko",
    "eff",
    "effing",
    "frick",
    "fricking",
    "freaking",
    "freakin",
    "frickin",
    "friggin",
    "frigging",
    "crud",
    "cruddy",
    "darn",
    "dang",
    "dadgum",
    "gosh",
    "golly",
    "jeez",
    "geez",
    "gee",
    "heck",
  ]),

  /**
   * Checks if a message contains profanity and returns severity level
   * Returns: null (no profanity), 'LOW', 'MEDIUM', or 'HIGH'
   */
  checkProfanity(content: string): { severity: string; word: string } | null {
    const normalized = content.toLowerCase();

    const matchesWord = (target: string, word: string): boolean => {
      if (word.includes("*")) {
        return target.includes(word);
      }
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, "i");
      return regex.test(target);
    };

    // Check HIGH severity first
    for (const word of this.highSeverity) {
      if (normalized.includes(word)) {
        return { severity: "HIGH", word };
      }
    }

    // Check MEDIUM severity
    for (const word of this.mediumSeverity) {
      if (matchesWord(normalized, word)) {
        return { severity: "MEDIUM", word };
      }
    }

    // Check LOW severity
    for (const word of this.lowSeverity) {
      if (matchesWord(normalized, word)) {
        return { severity: "LOW", word };
      }
    }

    return null;
  },
};
