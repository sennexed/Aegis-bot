/**
 * Central Blacklist Service
 * AegisMod Hybrid AutoMod Engine
 * 
 * Manages the persistent, central JSON-based blacklist for multi-lingual offensive terms
 * (Hindi, Russian, Arabic, Spanish, etc.) that the bot prioritizes locally at Tier-1
 * BEFORE sending any data or consuming tokens on Google Gemini.
 */

import fs from "fs";
import path from "path";
import { DEFAULT_PROFANITY_ENTRIES, PROFANITY_FILTER, ProfanityEntry } from "../config/profanityFilter.js";

export interface BlacklistTerm {
  id: string;
  term: string;
  language: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  category: "SEVERE_PROFANITY_OR_ABUSE" | "HATE_SPEECH" | "SELF_HARM" | "SEXUAL_GROOMING_OR_PREDATORY";
  isPhrase?: boolean;
  enabled: boolean;
  notes?: string;
  addedBy?: string;
  addedAt?: string;
}

export interface BlacklistDocument {
  version: string;
  name: string;
  description: string;
  triagePriority: string;
  tokenSavingsGuarantee: string;
  lastUpdated: string;
  totalTerms: number;
  activeTerms: number;
  languages: string[];
  terms: BlacklistTerm[];
}

export class CentralBlacklistService {
  private terms: Map<string, BlacklistTerm> = new Map();
  private dataDir = path.join(process.cwd(), "data");
  private storageFilePath = path.join(this.dataDir, "multilingual_blacklist.json");
  private writeQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }

      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        const doc: BlacklistDocument = JSON.parse(raw);
        if (Array.isArray(doc.terms)) {
          this.terms.clear();
          for (const item of doc.terms) {
            this.terms.set(item.id, {
              ...item,
              enabled: item.enabled !== false, // default true
            });
          }
          console.log(`[CentralBlacklist] 📚 Loaded ${this.terms.size} terms from central JSON blacklist.`);
          this.syncToFilter();
          return;
        }
      }

      // Seed from DEFAULT_PROFANITY_ENTRIES if no file exists yet
      this.seedDefaults();
    } catch (err) {
      console.warn("[CentralBlacklist] Warning loading central blacklist:", err);
      this.seedDefaults();
    }
  }

  private seedDefaults() {
    this.terms.clear();
    let idx = 1000;
    for (const entry of DEFAULT_PROFANITY_ENTRIES) {
      idx++;
      const id = `bl-${idx}`;
      this.terms.set(id, {
        id,
        term: entry.term,
        language: entry.language,
        severity: entry.severity,
        category: entry.category,
        isPhrase: entry.isPhrase || entry.term.includes(" "),
        enabled: true,
        notes: `Built-in verified ${entry.language} offensive terminology`,
        addedBy: "System Verified Lexicon",
        addedAt: new Date().toISOString(),
      });
    }

    this.persistToDisk();
    this.syncToFilter();
  }

  /**
   * Sync active enabled terms directly with PROFANITY_FILTER in memory
   * so server.ts and AutoMod triage prioritize them before Gemini
   */
  private syncToFilter() {
    const activeEntries: ProfanityEntry[] = [];
    for (const item of this.terms.values()) {
      if (item.enabled) {
        activeEntries.push({
          term: item.term,
          severity: item.severity,
          language: item.language,
          category: item.category,
          isPhrase: item.isPhrase,
        });
      }
    }
    PROFANITY_FILTER.reloadEntries(activeEntries);
  }

  private async persistToDisk(): Promise<void> {
    this.writeQueue = this.writeQueue
      .then(async () => {
        if (!fs.existsSync(this.dataDir)) {
          await fs.promises.mkdir(this.dataDir, { recursive: true });
        }
        const doc = this.getJsonDocument();
        await fs.promises.writeFile(this.storageFilePath, JSON.stringify(doc, null, 2), "utf8");
      })
      .catch((err) => {
        console.error("[CentralBlacklist] Failed to persist blacklist to disk:", err);
      });
    return this.writeQueue;
  }

  public getAll(filters?: {
    language?: string;
    severity?: string;
    category?: string;
    search?: string;
    enabled?: boolean;
  }): BlacklistTerm[] {
    let list = Array.from(this.terms.values());

    if (filters) {
      if (filters.language && filters.language !== "ALL") {
        list = list.filter((t) => t.language.toLowerCase().includes(filters.language!.toLowerCase()));
      }
      if (filters.severity && filters.severity !== "ALL") {
        list = list.filter((t) => t.severity === filters.severity);
      }
      if (filters.category && filters.category !== "ALL") {
        list = list.filter((t) => t.category === filters.category);
      }
      if (typeof filters.enabled === "boolean") {
        list = list.filter((t) => t.enabled === filters.enabled);
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        list = list.filter(
          (t) =>
            t.term.toLowerCase().includes(q) ||
            t.language.toLowerCase().includes(q) ||
            (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
    }

    return list;
  }

  public getById(id: string): BlacklistTerm | undefined {
    return this.terms.get(id);
  }

  public getJsonDocument(): BlacklistDocument {
    const list = Array.from(this.terms.values());
    const langSet = new Set<string>();
    let active = 0;

    for (const item of list) {
      if (item.language) langSet.add(item.language);
      if (item.enabled) active++;
    }

    return {
      version: "2.1.0",
      name: "AegisMod Central Multilingual Blacklist",
      description:
        "Central zero-latency pre-Gemini blacklist for localized profanity, severe cuss words, slurs, and regional abusive speech (Hindi, Russian, Arabic, etc.). Prioritized at Tier-1 before calling Gemini API.",
      triagePriority: "TIER_1_LOCAL_INTERCEPT (Prioritized before Gemini API)",
      tokenSavingsGuarantee: "100% tokens saved on matched local terms (0 tokens consumed)",
      lastUpdated: new Date().toISOString(),
      totalTerms: list.length,
      activeTerms: active,
      languages: Array.from(langSet).sort(),
      terms: list,
    };
  }

  public getMetadata() {
    const list = Array.from(this.terms.values());
    const langStats: Record<string, number> = {};
    const severityStats: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    const categoryStats: Record<string, number> = {};
    let activeCount = 0;

    for (const item of list) {
      if (item.enabled) activeCount++;
      langStats[item.language] = (langStats[item.language] || 0) + 1;
      severityStats[item.severity] = (severityStats[item.severity] || 0) + 1;
      categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
    }

    return {
      totalTerms: list.length,
      activeTerms: activeCount,
      disabledTerms: list.length - activeCount,
      languages: Object.keys(langStats).sort(),
      languageStats: langStats,
      severityStats,
      categoryStats,
      triagePriority: "Tier-1 Local Filter (Prioritized BEFORE Gemini API)",
      tokensSavedEstimate: activeCount * 420,
    };
  }

  public addTerm(item: Omit<BlacklistTerm, "id" | "addedAt">): BlacklistTerm {
    const id = `bl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTerm: BlacklistTerm = {
      ...item,
      id,
      term: item.term.trim(),
      enabled: item.enabled !== false,
      addedAt: new Date().toISOString(),
      addedBy: item.addedBy || "Staff Moderator",
    };

    this.terms.set(id, newTerm);
    this.persistToDisk();
    this.syncToFilter();
    return newTerm;
  }

  public updateTerm(id: string, updates: Partial<BlacklistTerm>): BlacklistTerm | null {
    const existing = this.terms.get(id);
    if (!existing) return null;

    const updated: BlacklistTerm = {
      ...existing,
      ...updates,
      term: updates.term ? updates.term.trim() : existing.term,
      id: existing.id, // prevent id tamper
    };

    this.terms.set(id, updated);
    this.persistToDisk();
    this.syncToFilter();
    return updated;
  }

  public deleteTerm(id: string): boolean {
    const deleted = this.terms.delete(id);
    if (deleted) {
      this.persistToDisk();
      this.syncToFilter();
    }
    return deleted;
  }

  public toggleTerm(id: string): BlacklistTerm | null {
    const existing = this.terms.get(id);
    if (!existing) return null;

    existing.enabled = !existing.enabled;
    this.terms.set(id, existing);
    this.persistToDisk();
    this.syncToFilter();
    return existing;
  }

  public importJson(
    rawInput: string | any,
    mode: "MERGE" | "REPLACE" = "MERGE"
  ): { success: boolean; importedCount: number; message: string } {
    let parsed: any;
    if (typeof rawInput === "string") {
      try {
        parsed = JSON.parse(rawInput);
      } catch (err: any) {
        return { success: false, importedCount: 0, message: `Invalid JSON syntax: ${err?.message}` };
      }
    } else {
      parsed = rawInput;
    }

    const items: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.terms)
      ? parsed.terms
      : [];

    if (!items.length) {
      return { success: false, importedCount: 0, message: "JSON contains no valid term array" };
    }

    if (mode === "REPLACE") {
      this.terms.clear();
    }

    let count = 0;
    for (const rawItem of items) {
      if (!rawItem || typeof rawItem.term !== "string" || !rawItem.term.trim()) continue;

      const id = rawItem.id || `bl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const termObj: BlacklistTerm = {
        id,
        term: rawItem.term.trim(),
        language: rawItem.language || "Multi-lingual",
        severity: ["HIGH", "MEDIUM", "LOW"].includes(rawItem.severity) ? rawItem.severity : "HIGH",
        category: [
          "SEVERE_PROFANITY_OR_ABUSE",
          "HATE_SPEECH",
          "SELF_HARM",
          "SEXUAL_GROOMING_OR_PREDATORY",
        ].includes(rawItem.category)
          ? rawItem.category
          : "SEVERE_PROFANITY_OR_ABUSE",
        isPhrase: typeof rawItem.isPhrase === "boolean" ? rawItem.isPhrase : rawItem.term.includes(" "),
        enabled: rawItem.enabled !== false,
        notes: rawItem.notes || "Imported via Central Blacklist JSON",
        addedBy: rawItem.addedBy || "JSON Import",
        addedAt: rawItem.addedAt || new Date().toISOString(),
      };

      this.terms.set(id, termObj);
      count++;
    }

    this.persistToDisk();
    this.syncToFilter();

    return {
      success: true,
      importedCount: count,
      message: `Successfully ${mode === "REPLACE" ? "replaced" : "merged"} ${count} terms in central blacklist.`,
    };
  }

  public resetToDefaults(): number {
    this.seedDefaults();
    return this.terms.size;
  }

  /**
   * Test text against the central prioritized blacklist
   */
  public testContent(content: string) {
    const trimmed = (content || "").trim();
    if (!trimmed) {
      return {
        matched: false,
        verdict: "CLEAN_PASS",
        priority: "No input provided",
        tokensConsumed: 0,
        tokensSaved: 0,
        explanation: "Empty input.",
      };
    }

    // Run active profanity check (already synced with central blacklist)
    const match = PROFANITY_FILTER.checkProfanity(trimmed);

    if (match) {
      return {
        matched: true,
        word: match.word,
        language: match.language,
        severity: match.severity,
        category: match.category,
        triageStage: "TIER_1_LOCAL_INTERCEPT",
        priorityExplanation: "PRIORITIZED BEFORE GEMINI: Flagged locally by central blacklist at 0ms latency with 0 tokens consumed.",
        tokensConsumed: 0,
        tokensSaved: 420,
        recommendedAction: match.severity === "HIGH" ? "DELETE" : "WARN",
        simulatedReason: `Prohibited abusive local speech detected (${match.language}): "${match.word}"`,
      };
    }

    return {
      matched: false,
      triageStage: "TIER_3_GEMINI_DEEP_EVALUATION",
      priorityExplanation: "PASSED TIER-1 LOCAL BLACKLIST: Content contains no blacklisted multilingual offensive terms. Routed to Gemini 3.8 Flash for contextual safety assessment.",
      tokensConsumed: 420,
      tokensSaved: 0,
      recommendedAction: "ALLOW",
      simulatedReason: "No blacklisted multilingual terms found. Standard conversational triage applied.",
    };
  }
}

export const centralBlacklistService = new CentralBlacklistService();
