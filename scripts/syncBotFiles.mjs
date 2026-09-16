import fs from "fs";
import path from "path";

const botCodeDir = path.resolve("src/bot-code");
const distDir = path.resolve("src/bot-code/dist");

// 1. Compile dist files into compiledBotDist.json
const distFiles = [];

function walkDir(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, baseDir);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      const relPath = path.relative(baseDir, fullPath);
      distFiles.push({
        path: `dist/${relPath}`,
        content: fs.readFileSync(fullPath, "utf8"),
      });
    }
  }
}

if (fs.existsSync(distDir)) {
  walkDir(distDir);
}

fs.writeFileSync(
  path.resolve("src/data/compiledBotDist.json"),
  JSON.stringify(distFiles, null, 2),
  "utf8"
);
console.log(`Synced ${distFiles.length} dist files into src/data/compiledBotDist.json`);

// 2. Generate src/data/botFiles.ts
const fileMeta = [
  {
    path: "src/index.ts",
    filename: "index.ts",
    category: "entry",
    description: "Discord client bootstrap, Privileged Gateway Intents, slash command registration, event routing",
  },
  {
    path: "src/services/policyEngine.ts",
    filename: "policyEngine.ts",
    category: "service",
    description: "Strict deterministic escalation policy engine and classification validation layer",
  },
  {
    path: "src/services/geminiModerationService.ts",
    filename: "geminiModerationService.ts",
    category: "service",
    description: "Gemini 3.8 Flash connection with @google/genai, structured JSON schema response, teen moderation rubric",
  },
  {
    path: "src/services/triageService.ts",
    filename: "triageService.ts",
    category: "service",
    description: "Multi-tier token efficiency pipeline, local regex fast-pass, TTL LRU cache (80-90% token reduction)",
  },
  {
    path: "src/services/roleService.ts",
    filename: "roleService.ts",
    category: "service",
    description: "Interactive role setup with RoleSelectMenuBuilder, role hierarchy validation, permission checks",
  },
  {
    path: "src/services/traditionalModService.ts",
    filename: "traditionalModService.ts",
    category: "service",
    description: "Traditional moderation actions (/ban, /kick, /mute, /warn, /cases) with persistent case tracking",
  },
  {
    path: "src/services/loggingService.ts",
    filename: "loggingService.ts",
    category: "service",
    description: "Dedicated #mod-logs audit channel manager with rich embeds for AI actions, deletes, and edits",
  },
  {
    path: "src/commands/setup.ts",
    filename: "setup.ts",
    category: "command",
    description: "/setup interactive onboarding wizard with Discord Role Select Menus and auto log channel creation",
  },
  {
    path: "src/commands/moderation.ts",
    filename: "moderation.ts",
    category: "command",
    description: "Traditional moderation slash commands (/ban, /kick, /mute, /warn, /cases) with validation",
  },
  {
    path: "src/events/messageCreate.ts",
    filename: "messageCreate.ts",
    category: "event",
    description: "Real-time message moderation pipeline: Triage -> Gemini -> Policy Engine -> Execution -> #mod-logs",
  },
  {
    path: "src/events/messageUpdate.ts",
    filename: "messageUpdate.ts",
    category: "event",
    description: "Message edit tracking: Logs diff to #mod-logs and re-scans edited content to prevent bypasses",
  },
  {
    path: "src/events/messageDelete.ts",
    filename: "messageDelete.ts",
    category: "event",
    description: "Message delete audit logger: captures content, author, and channel details in #mod-logs",
  },
  {
    path: "src/config/safetyRubric.ts",
    filename: "safetyRubric.ts",
    category: "config",
    description: "Teen community safety standards (ages ~16), violation categories, severities, and AI system prompt",
  },
  {
    path: "package.json",
    filename: "package.json",
    category: "config",
    description: "Project manifest with discord.js v14, @google/genai SDK, tsx runner, and scripts",
  },
  {
    path: "README.md",
    filename: "README.md",
    category: "docs",
    description: "Architecture overview, bot setup instructions, permissions, and deployment steps",
  },
];

const botFiles = fileMeta.map((meta) => {
  const filePath = path.join(botCodeDir, meta.path);
  let content = "";
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  } else {
    console.warn(`File not found: ${filePath}`);
  }
  return {
    ...meta,
    content,
  };
});

const tsOutput = `/**
 * Pre-bundled Discord Bot Source Code for Code Explorer and ZIP Exporter
 * Auto-synced from src/bot-code
 */

export interface BotFileDefinition {
  path: string;
  filename: string;
  category: "entry" | "service" | "command" | "event" | "config" | "docs";
  description: string;
  content: string;
}

export const BOT_FILES: BotFileDefinition[] = ${JSON.stringify(botFiles, null, 2)};
`;

fs.writeFileSync(path.resolve("src/data/botFiles.ts"), tsOutput, "utf8");
console.log(`Synced ${botFiles.length} source files into src/data/botFiles.ts`);
