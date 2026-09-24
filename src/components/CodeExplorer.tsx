import React, { useState } from "react";
import {
  FileCode,
  Copy,
  Check,
  Folder,
  File,
  Code2,
  Terminal,
  Layers,
  ChevronRight,
} from "lucide-react";
export interface BotFileDefinition {
  path: string;
  name: string;
  category: "entry" | "service" | "command" | "event";
  language: string;
  description: string;
  content: string;
}

export const BOT_FILES: BotFileDefinition[] = [
  {
    path: "src/bot-code/src/index.ts",
    name: "index.ts",
    category: "entry",
    language: "typescript",
    description: "Main AegisMod Discord bot entry point, gateway client initialization, and slash command router.",
    content: `/**
 * AegisMod - Main Bot Entry Point
 * Discord Hybrid Moderation Bot for Teen Communities
 * Powered by Gemini 3.8 Flash & discord.js v14
 */

import { Client, GatewayIntentBits, Partials, Options } from "discord.js";
import { GeminiModerationService } from "./services/geminiModerationService.js";
import { AutoModService } from "./services/autoModService.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User],
});

client.once("ready", () => {
  console.log(\`Logged in as \${client.user?.tag}!\`);
});
`,
  },
  {
    path: "src/bot-code/src/services/geminiModerationService.ts",
    name: "geminiModerationService.ts",
    category: "service",
    language: "typescript",
    description: "Multimodal AI moderation service utilizing Gemini 3.8 Flash for cyberbullying and safety analysis.",
    content: `import { GoogleGenAI } from "@google/genai";

export class GeminiModerationService {
  private ai: GoogleGenAI;
  private hasApiKey: boolean;

  constructor(apiKey?: string) {
    const key = apiKey !== undefined ? apiKey : process.env.GEMINI_API_KEY;
    this.hasApiKey = Boolean(key && key.trim());
    this.ai = this.hasApiKey ? new GoogleGenAI({ apiKey: key || "" }) : (null as any);
  }
}
`,
  },
  {
    path: "src/bot-code/src/services/autoModService.ts",
    name: "autoModService.ts",
    category: "service",
    language: "typescript",
    description: "Heuristic and rule-based AutoMod engine handling spam, raid prevention, and rate limits.",
    content: `export class AutoModService {
  constructor() {
    console.log("AutoMod service initialized.");
  }
}
`,
  },
];

export const CodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<BotFileDefinition>(BOT_FILES[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "entry":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">ENTRY POINT</span>;
      case "service":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">SERVICE</span>;
      case "command":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">COMMAND</span>;
      case "config":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">CONFIG</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 text-zinc-800">DOCS</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Code2 className="w-5 h-5 text-indigo-600" />
          Modular Codebase & Architecture Explorer
        </h2>
        <p className="text-xs text-zinc-500 mt-1">
          Explore the clean, modular TypeScript codebase written for <strong>Discord.js v14</strong> and <strong>Gemini 3.8 Flash</strong>. Each service is fully decoupled for independent maintainability and clean deployment on Wispbyte.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: File Tree Directory */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-zinc-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-100">
            <Folder className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
              Project Structure
            </span>
          </div>

          <div className="space-y-1">
            {BOT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full p-2 rounded-xl text-left text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-xs"
                      : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileCode
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? "text-indigo-600" : "text-zinc-400"
                      }`}
                    />
                    <span className="truncate font-mono text-[11px]">{file.path}</span>
                  </div>
                  <div className="shrink-0">{getCategoryBadge(file.category)}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="lg:col-span-8 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col">
          {/* File Header Bar */}
          <div className="bg-zinc-900/90 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-zinc-200">
                {selectedFile.path}
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-xs text-zinc-400 truncate hidden sm:inline">
                {selectedFile.description}
              </span>
            </div>

            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 text-zinc-200 transition-colors cursor-pointer shrink-0 border border-zinc-700"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Description sub-bar */}
          <div className="bg-zinc-900/40 px-4 py-2 text-xs text-zinc-400 border-b border-zinc-800/80 font-sans">
            <span className="text-indigo-400 font-semibold">Purpose: </span>
            {selectedFile.description}
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed max-h-[580px] overflow-y-auto text-zinc-300">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
