/**
 * Audit Log Exporter & Transparency Report Service
 * Exports moderation actions, cases, and staff activity into RFC-4180 CSV
 * and structured JSON, and generates executive transparency summaries for server owners.
 */

import { InfractionRecord } from "./traditionalModService.js";

export interface ExportOptions {
  timeframeDays?: number; // 7, 30, or undefined for all-time
  categoryFilter?: string;
  actionFilter?: string;
}

export interface TransparencyReportSummary {
  guildId: string;
  guildName: string;
  generatedAt: number;
  timeframeLabel: string;
  totalIncidents: number;
  actionBreakdown: {
    bans: number;
    kicks: number;
    timeouts: number;
    warnings: number;
    unmutes: number;
  };
  categoryBreakdown: Record<string, number>;
  topActiveModerators: Array<{ moderatorTag: string; count: number }>;
  uniqueUsersSanctioned: number;
}

export class AuditExportService {
  /**
   * Filters cases by timeframe and criteria
   */
  public filterCases(cases: InfractionRecord[], options: ExportOptions = {}): InfractionRecord[] {
    const now = Date.now();
    let result = [...cases];

    if (options.timeframeDays && options.timeframeDays > 0) {
      const cutoff = now - options.timeframeDays * 24 * 60 * 60 * 1000;
      result = result.filter((c) => c.timestamp >= cutoff);
    }

    if (options.actionFilter && options.actionFilter !== "ALL") {
      result = result.filter((c) => c.action === options.actionFilter);
    }

    if (options.categoryFilter && options.categoryFilter !== "ALL") {
      const cat = options.categoryFilter.toLowerCase();
      result = result.filter((c) => c.reason.toLowerCase().includes(cat));
    }

    return result.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Generates RFC-4180 compliant CSV string
   */
  public exportCsv(cases: InfractionRecord[], options: ExportOptions = {}): string {
    const filtered = this.filterCases(cases, options);
    const headers = ["Case ID", "Timestamp (UTC)", "Target User ID", "Target User Tag", "Moderator ID", "Moderator Tag", "Action", "Reason"];

    const escapeCsv = (val: string | number | undefined) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filtered.map((c) => {
      const isoTime = new Date(c.timestamp).toISOString();
      return [
        escapeCsv(c.caseId),
        escapeCsv(isoTime),
        escapeCsv(c.targetId),
        escapeCsv(c.targetTag),
        escapeCsv(c.moderatorId),
        escapeCsv(c.moderatorTag),
        escapeCsv(c.action),
        escapeCsv(c.reason),
      ].join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  }

  /**
   * Generates formatted JSON export string
   */
  public exportJson(guildId: string, guildName: string, cases: InfractionRecord[], options: ExportOptions = {}): string {
    const filtered = this.filterCases(cases, options);
    const exportObject = {
      metadata: {
        exportVersion: "2.0.0",
        guildId,
        guildName,
        exportedAt: new Date().toISOString(),
        timeframeDays: options.timeframeDays || "ALL_TIME",
        totalRecords: filtered.length,
      },
      records: filtered.map((c) => ({
        ...c,
        dateTimeUtc: new Date(c.timestamp).toISOString(),
      })),
    };

    return JSON.stringify(exportObject, null, 2);
  }

  /**
   * Generates high-level transparency statistics
   */
  public generateTransparencySummary(
    guildId: string,
    guildName: string,
    cases: InfractionRecord[],
    options: ExportOptions = {}
  ): TransparencyReportSummary {
    const filtered = this.filterCases(cases, options);

    const actionBreakdown = {
      bans: 0,
      kicks: 0,
      timeouts: 0,
      warnings: 0,
      unmutes: 0,
    };

    const modCountMap = new Map<string, number>();
    const uniqueUserSet = new Set<string>();
    const categoryBreakdown: Record<string, number> = {
      "Predatory / Grooming": 0,
      "Self-Harm / Crisis": 0,
      "Harassment / Cyberbullying": 0,
      "Hate Speech": 0,
      "Phishing / Scam Links": 0,
      "Spam / Flooding": 0,
      "General Rule Violation": 0,
    };

    for (const c of filtered) {
      if (c.action === "BAN") actionBreakdown.bans++;
      else if (c.action === "KICK") actionBreakdown.kicks++;
      else if (c.action === "MUTE") actionBreakdown.timeouts++;
      else if (c.action === "WARN") actionBreakdown.warnings++;
      else if (c.action === "UNMUTE") actionBreakdown.unmutes++;

      uniqueUserSet.add(c.targetId);

      const modKey = c.moderatorTag || "System AutoMod";
      modCountMap.set(modKey, (modCountMap.get(modKey) || 0) + 1);

      const r = c.reason.toLowerCase();
      if (r.includes("predatory") || r.includes("grooming")) {
        categoryBreakdown["Predatory / Grooming"]++;
      } else if (r.includes("self-harm") || r.includes("crisis") || r.includes("suicide")) {
        categoryBreakdown["Self-Harm / Crisis"]++;
      } else if (r.includes("harass") || r.includes("bullying")) {
        categoryBreakdown["Harassment / Cyberbullying"]++;
      } else if (r.includes("hate") || r.includes("slur")) {
        categoryBreakdown["Hate Speech"]++;
      } else if (r.includes("phishing") || r.includes("nitro") || r.includes("scam")) {
        categoryBreakdown["Phishing / Scam Links"]++;
      } else if (r.includes("spam") || r.includes("flood") || r.includes("caps")) {
        categoryBreakdown["Spam / Flooding"]++;
      } else {
        categoryBreakdown["General Rule Violation"]++;
      }
    }

    const topActiveModerators = Array.from(modCountMap.entries())
      .map(([moderatorTag, count]) => ({ moderatorTag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      guildId,
      guildName,
      generatedAt: Date.now(),
      timeframeLabel: options.timeframeDays ? `Last ${options.timeframeDays} Days` : "All-Time",
      totalIncidents: filtered.length,
      actionBreakdown,
      categoryBreakdown,
      topActiveModerators,
      uniqueUsersSanctioned: uniqueUserSet.size,
    };
  }
}
