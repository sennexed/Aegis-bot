/**
 * Leave of Absence (LOA) Service
 * Manages staff time-off requests, vacation approvals,
 * coverage forecasting, and anti-burnout protections.
 */

import fs from "fs";
import path from "path";

export type LoaStatus = "PENDING" | "APPROVED" | "DENIED" | "EXPIRED" | "CANCELLED";

export interface LoaRecord {
  id: string; // e.g. "LOA-1001"
  guildId: string;
  userId: string;
  userTag: string;
  reason: string;
  durationDays: number;
  startDate: number; // timestamp ms
  endDate: number; // timestamp ms
  status: LoaStatus;
  createdAt: number;
  reviewedBy?: string; // admin userTag
  reviewedById?: string;
  reviewedAt?: number;
  reviewNotes?: string;
  endedEarlyAt?: number;
}

export class LoaService {
  private loaMap = new Map<string, LoaRecord[]>();
  private storageFilePath: string;
  private isSaving = false;

  constructor(storageDir?: string) {
    const dir = storageDir || path.resolve(process.cwd(), "data");
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // Ignored
      }
    }
    this.storageFilePath = path.join(dir, "loa_records.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        const parsed: Record<string, LoaRecord[]> = JSON.parse(raw);
        for (const [guildId, records] of Object.entries(parsed)) {
          this.loaMap.set(guildId, records);
        }
      }
    } catch (err) {
      console.error("[LoaService] Failed to load LOA records from disk:", err);
    }
  }

  private persistToDisk() {
    if (this.isSaving) return;
    this.isSaving = true;

    setTimeout(() => {
      try {
        const serializable: Record<string, LoaRecord[]> = {};
        for (const [guildId, records] of this.loaMap.entries()) {
          serializable[guildId] = records;
        }
        fs.writeFileSync(this.storageFilePath, JSON.stringify(serializable, null, 2), "utf8");
      } catch (err) {
        console.error("[LoaService] Failed to write LOA records to disk:", err);
      } finally {
        this.isSaving = false;
      }
    }, 200);
  }

  private getGuildList(guildId: string): LoaRecord[] {
    if (!this.loaMap.has(guildId)) {
      this.loaMap.set(guildId, []);
    }
    return this.loaMap.get(guildId)!;
  }

  /**
   * Automatically updates status to EXPIRED for records past their end date
   */
  public sweepExpired(guildId: string) {
    const list = this.getGuildList(guildId);
    const now = Date.now();
    let changed = false;

    for (const rec of list) {
      if (rec.status === "APPROVED" && !rec.endedEarlyAt && now > rec.endDate) {
        rec.status = "EXPIRED";
        changed = true;
      }
    }

    if (changed) {
      this.persistToDisk();
    }
  }

  /**
   * Request a new Leave of Absence
   */
  public requestLoa(
    guildId: string,
    userId: string,
    userTag: string,
    durationDays: number,
    reason: string
  ): { success: boolean; loa?: LoaRecord; message: string } {
    this.sweepExpired(guildId);
    const list = this.getGuildList(guildId);

    // Check if user already has an active or pending LOA
    const existingActive = list.find(
      (r) =>
        r.userId === userId &&
        (r.status === "PENDING" || (r.status === "APPROVED" && !r.endedEarlyAt && Date.now() <= r.endDate))
    );

    if (existingActive) {
      return {
        success: false,
        message: `You already have an existing LOA record (${existingActive.id}) with status \`${existingActive.status}\`. Please resolve or end that LOA first.`,
      };
    }

    const now = Date.now();
    const endDate = now + durationDays * 24 * 60 * 60 * 1000;
    const newId = `LOA-${1000 + list.length + 1}`;

    const newRecord: LoaRecord = {
      id: newId,
      guildId,
      userId,
      userTag,
      reason,
      durationDays,
      startDate: now,
      endDate,
      status: "PENDING",
      createdAt: now,
    };

    list.unshift(newRecord);
    this.persistToDisk();

    return {
      success: true,
      loa: newRecord,
      message: `Leave of Absence request \`${newId}\` submitted for ${durationDays} days. Awaiting Admin review.`,
    };
  }

  /**
   * Approve an LOA request (Admin only)
   */
  public approveLoa(
    guildId: string,
    loaId: string,
    reviewerId: string,
    reviewerTag: string,
    notes?: string
  ): { success: boolean; loa?: LoaRecord; message: string } {
    const list = this.getGuildList(guildId);
    const loa = list.find((r) => r.id.toLowerCase() === loaId.toLowerCase());

    if (!loa) {
      return { success: false, message: `LOA record \`${loaId}\` was not found.` };
    }

    if (loa.status === "APPROVED") {
      return { success: false, message: `LOA \`${loaId}\` is already approved.` };
    }

    const now = Date.now();
    loa.status = "APPROVED";
    loa.startDate = now;
    loa.endDate = now + loa.durationDays * 24 * 60 * 60 * 1000;
    loa.reviewedBy = reviewerTag;
    loa.reviewedById = reviewerId;
    loa.reviewedAt = now;
    if (notes) loa.reviewNotes = notes;

    this.persistToDisk();

    return {
      success: true,
      loa,
      message: `LOA \`${loa.id}\` for ${loa.userTag} has been APPROVED until <t:${Math.floor(loa.endDate / 1000)}:D> (${loa.durationDays} days).`,
    };
  }

  /**
   * Deny an LOA request (Admin only)
   */
  public denyLoa(
    guildId: string,
    loaId: string,
    reviewerId: string,
    reviewerTag: string,
    reason?: string
  ): { success: boolean; loa?: LoaRecord; message: string } {
    const list = this.getGuildList(guildId);
    const loa = list.find((r) => r.id.toLowerCase() === loaId.toLowerCase());

    if (!loa) {
      return { success: false, message: `LOA record \`${loaId}\` was not found.` };
    }

    loa.status = "DENIED";
    loa.reviewedBy = reviewerTag;
    loa.reviewedById = reviewerId;
    loa.reviewedAt = Date.now();
    if (reason) loa.reviewNotes = reason;

    this.persistToDisk();

    return {
      success: true,
      loa,
      message: `LOA \`${loa.id}\` for ${loa.userTag} has been DENIED. Reason: ${reason || "No notes provided"}.`,
    };
  }

  /**
   * End an active LOA early (by the staff member or admin)
   */
  public endLoa(
    guildId: string,
    targetIdOrLoaId: string,
    endedById: string,
    endedByTag: string
  ): { success: boolean; loa?: LoaRecord; message: string } {
    const list = this.getGuildList(guildId);
    const now = Date.now();

    // Match either by LOA ID or by User ID
    const loa = list.find(
      (r) =>
        (r.id.toLowerCase() === targetIdOrLoaId.toLowerCase() || r.userId === targetIdOrLoaId) &&
        r.status === "APPROVED" &&
        !r.endedEarlyAt &&
        now <= r.endDate
    );

    if (!loa) {
      return {
        success: false,
        message: `No active approved LOA found matching \`${targetIdOrLoaId}\`.`,
      };
    }

    loa.endedEarlyAt = now;
    loa.status = "EXPIRED";
    this.persistToDisk();

    return {
      success: true,
      loa,
      message: `Leave of Absence \`${loa.id}\` for ${loa.userTag} has been marked as completed early by ${endedByTag}. Welcome back!`,
    };
  }

  /**
   * Get active approved LOA for a specific user
   */
  public getActiveLoaForUser(guildId: string, userId: string): LoaRecord | undefined {
    this.sweepExpired(guildId);
    const list = this.getGuildList(guildId);
    const now = Date.now();

    return list.find(
      (r) => r.userId === userId && r.status === "APPROVED" && !r.endedEarlyAt && now <= r.endDate
    );
  }

  /**
   * Boolean check if user is on active approved LOA
   */
  public isUserOnLoa(guildId: string, userId: string): boolean {
    return !!this.getActiveLoaForUser(guildId, userId);
  }

  /**
   * Retrieve LOA records with optional filter
   */
  public getGuildLoas(guildId: string, filter?: LoaStatus | "ACTIVE"): LoaRecord[] {
    this.sweepExpired(guildId);
    const list = this.getGuildList(guildId);
    const now = Date.now();

    if (!filter) return [...list];

    if (filter === "ACTIVE") {
      return list.filter((r) => r.status === "APPROVED" && !r.endedEarlyAt && now <= r.endDate);
    }

    return list.filter((r) => r.status === filter);
  }
}
