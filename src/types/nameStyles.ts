/**
 * Discord Bot Name Styles Catalog & Definitions
 * Based on Discord's Display Name Styles system (Fonts, Visual Effects, Colors, and Clan/Badge tags)
 * Compatible with Discord REST API and decorative nickname styling
 */

export interface FontStyleDefinition {
  id: string;
  name: string;
  category: "Classic" | "Display" | "Retro" | "Playful" | "Modern";
  fontFamily: string;
  description: string;
  cssStyle?: string;
  // Unicode transform mapping for standard latin characters
  transform?: (text: string) => string;
}

export interface EffectStyleDefinition {
  id: string;
  name: string;
  description: string;
  previewClass: string;
  cssAnimation?: string;
  badge: string;
}

export interface ColorPresetDefinition {
  id: string;
  name: string;
  hex: string;
  decimal: number; // Decimal format required by Discord API
  secondaryHex?: string;
}

export interface BotNameStyleConfig {
  displayName: string;
  fontId: string;
  effectId: string;
  primaryColor: string;
  secondaryColor?: string;
  clanTag?: string;
  clanBadge?: string;
  autoSyncNickname: boolean;
  applyGlobally: boolean;
}

// 12 Distinct Discord Display Name Fonts
export const BOT_NAME_FONTS: FontStyleDefinition[] = [
  {
    id: "gg-sans",
    name: "gg sans (Default)",
    category: "Classic",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    description: "Discord's official default geometric sans-serif typeface.",
  },
  {
    id: "bangers",
    name: "Bangers",
    category: "Display",
    fontFamily: "'Impact', 'Arial Black', sans-serif",
    description: "High-energy, bold comic-book superhero headline display style.",
    transform: (t) => t.toUpperCase(),
  },
  {
    id: "biorhyme",
    name: "BioRhyme",
    category: "Modern",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    description: "Elegant slab-serif typeface with generous optical widths.",
  },
  {
    id: "cherry-bomb",
    name: "Cherry Bomb (Sakura)",
    category: "Playful",
    fontFamily: "'Trebuchet MS', cursive, sans-serif",
    description: "Cute, bubbly Japanese rounded aesthetic popular in teen servers.",
  },
  {
    id: "chicle",
    name: "Chicle (Jellybean)",
    category: "Playful",
    fontFamily: "'Comic Sans MS', cursive, sans-serif",
    description: "Playful, organic chewy bubble typography with dynamic bounce.",
  },
  {
    id: "compagnon",
    name: "Compagnon",
    category: "Modern",
    fontFamily: "'Courier New', Courier, monospace",
    description: "Mechanical typewriter and architectural monospace blend.",
  },
  {
    id: "museo-moderno",
    name: "MuseoModerno (Modern)",
    category: "Modern",
    fontFamily: "system-ui, sans-serif",
    description: "Geometric, minimalist avant-garde typeface with smooth circular curves.",
  },
  {
    id: "neo-castel",
    name: "Neo Castel (Medieval)",
    category: "Display",
    fontFamily: "'Cinzel', 'Palatino', serif",
    description: "Gothic Blackletter Y2K hybrid aesthetics with sharp serifs.",
    transform: (text) => toGothicMath(text),
  },
  {
    id: "pixelify",
    name: "Pixelify Sans (8Bit)",
    category: "Retro",
    fontFamily: "'Courier New', monospace",
    description: "Retro arcade 8-bit grid pixel typography for gaming communities.",
  },
  {
    id: "ribes",
    name: "Ribes",
    category: "Display",
    fontFamily: "'Trebuchet MS', sans-serif",
    description: "Experimental flared display style with organic stroke weight.",
  },
  {
    id: "sinistre",
    name: "Sinistre",
    category: "Display",
    fontFamily: "'Times New Roman', serif",
    description: "Sharp mystical gothic display with dramatic terminal flourishes.",
  },
  {
    id: "zilla-slab",
    name: "Zilla Slab",
    category: "Classic",
    fontFamily: "'Rockwell', 'Courier New', serif",
    description: "Sophisticated industrial slab serif crafted with crisp geometry.",
  },
];

// 6 Discord Visual Effects
export const BOT_NAME_EFFECTS: EffectStyleDefinition[] = [
  {
    id: "solid",
    name: "Solid",
    description: "Clean single or duo-tone high-contrast flat coloration.",
    previewClass: "font-semibold tracking-normal",
    badge: "FLAT",
  },
  {
    id: "gradient",
    name: "Linear Gradient",
    description: "Smooth chromatic transition across the bot's display name characters.",
    previewClass: "bg-linear-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-bold",
    badge: "GRADIENT",
  },
  {
    id: "neon",
    name: "Neon Glow",
    description: "Vibrant fluorescent backlight bloom with vivid text radiance.",
    previewClass: "text-emerald-400 [text-shadow:0_0_8px_rgba(52,211,153,0.8),0_0_20px_rgba(16,185,129,0.5)] font-bold",
    badge: "NEON",
  },
  {
    id: "toon",
    name: "Toon / Outline",
    description: "Cell-shaded cartoon pop-out with deep contrast boundary stroke.",
    previewClass: "text-amber-300 font-extrabold [text-shadow:-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000,1px_1px_0_#000,2px_2px_0_#000]",
    badge: "TOON",
  },
  {
    id: "pop",
    name: "Pop 3D",
    description: "Layered dimensional extrusion giving the name an elevated 3D depth.",
    previewClass: "text-cyan-300 font-black [text-shadow:1px_1px_0_#0e7490,2px_2px_0_#155e75,3px_3px_0_#164e63]",
    badge: "3D POP",
  },
  {
    id: "glow",
    name: "Prism Radiance",
    description: "Multi-spectrum prismatic chromatic shimmer with pulsing glow.",
    previewClass: "text-white font-extrabold [text-shadow:0_0_10px_#818cf8,0_0_20px_#ec4899]",
    badge: "PRISM",
  },
];

// Curated Discord Color Palettes (with Hex & Decimal values)
export const BOT_COLOR_PRESETS: ColorPresetDefinition[] = [
  { id: "discord-blurple", name: "Discord Blurple", hex: "#5865F2", decimal: 5793266, secondaryHex: "#858EFA" },
  { id: "cyber-emerald", name: "Cyber Emerald", hex: "#10B981", decimal: 1096065, secondaryHex: "#34D399" },
  { id: "neon-cyan", name: "Neon Cyan", hex: "#06B6D4", decimal: 439956, secondaryHex: "#67E8F9" },
  { id: "sakura-pink", name: "Sakura Pink", hex: "#EC4899", decimal: 15485081, secondaryHex: "#F472B6" },
  { id: "hyper-violet", name: "Hyper Violet", hex: "#8B5CF6", decimal: 9133302, secondaryHex: "#A78BFA" },
  { id: "solar-amber", name: "Solar Amber", hex: "#F59E0B", decimal: 16096779, secondaryHex: "#FBBF24" },
  { id: "crimson-ruby", name: "Crimson Ruby", hex: "#EF4444", decimal: 15680580, secondaryHex: "#F87171" },
  { id: "pure-onyx", name: "Midnight Onyx", hex: "#18181B", decimal: 1579035, secondaryHex: "#3F3F46" },
];

// Helper: Convert hex string to Discord API decimal color
export function hexToDiscordDecimal(hex: string): number {
  const clean = hex.replace("#", "");
  return parseInt(clean, 16) || 0;
}

// Helper: Convert decimal to hex
export function discordDecimalToHex(decimal: number): string {
  return "#" + decimal.toString(16).padStart(6, "0");
}

// Math Unicode Gothic transformer for Neo Castel / Medieval
function toGothicMath(text: string): string {
  const gothicMap: Record<string, string> = {
    A: "𝔄", B: "𝔅", C: "ℭ", D: "𝔇", E: "𝔈", F: "𝔉", G: "𝔊", H: "ℌ", I: "ℑ",
    J: "𝔍", K: "𝔎", L: "𝔏", M: "𝔐", N: "𝔑", O: "𝔒", P: "𝔓", Q: "𝔔", R: "ℜ",
    S: "𝔖", T: "𝔗", U: "𝔘", V: "𝔙", W: "𝔚", X: "𝔛", Y: "𝔜", Z: "ℨ",
    a: "𝔞", b: "𝔟", c: "𝔠", d: "𝔡", e: "𝔢", f: "𝔣", g: "𝔤", h: "𝔥", i: "𝔦",
    j: "𝔧", k: "𝔨", l: "𝔩", m: "𝔪", n: "𝔫", o: "𝔬", p: "𝔭", q: "𝔮", r: "𝔯",
    s: "𝔰", t: "𝔱", u: "𝔲", v: "𝔳", w: "𝔴", x: "𝔵", y: "𝔶", z: "𝔯",
  };
  return text
    .split("")
    .map((char) => gothicMap[char] || char)
    .join("");
}

// Default Bot Name Style State
export const DEFAULT_BOT_NAME_STYLE: BotNameStyleConfig = {
  displayName: "AegisMod",
  fontId: "gg-sans",
  effectId: "gradient",
  primaryColor: "#5865F2",
  secondaryColor: "#EC4899",
  clanTag: "AEGIS",
  clanBadge: "🛡️",
  autoSyncNickname: true,
  applyGlobally: true,
};
