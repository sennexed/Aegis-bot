/**
 * Staff Duty Tracking Service
 * Tracks active moderator shifts, on-duty check-ins/outs,
 * shift durations, and active coverage for teen community safety.
 */

import fs from "fs";
import path from "path";

export interface StaffShiftRecord {
  userId: string;
  userTag: string;
  guildId: string;
  isOnDuty: boolean;
  shiftStartedAt?: number;
  currentShiftMinutes?: number;
  note?: string;
  totalCompletedShifts: number;
  totalDutyTimeMs: number;
  lastShiftEndAt?: number;
}

export class DutyService {
  private dutyMap = new Map<string, Map<string, StaffShiftRecord>>();
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
    this.storageFilePath = path.join(dir, "staff_duty.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        const parsed: Record<string, Record<string, StaffShiftRecord>> = JSON.parse(raw);
        for (const [guildId, users] of Object.entries(parsed)) {
          const userMap = new Map<string, StaffShiftRecord>();
          for (const [userId, record] of Object.entries(users)) {
            userMap.set(userId, record);
          }
          this.dutyMap.set(guildId, userMap);
        }
      }
    } catch (err) {
      console.error("[DutyService] Failed to load duty state from disk:", err);
    }
  }

  private persistToDisk() {
    if (this.isSaving) return;
    this.isSaving = true;

    const data: Record<string, Record<string, StaffShiftRecord>> = {};
    for (const [guildId, users] of this.dutyMap.entries()) {
      data[guildId] = {};
      for (const [userId, record] of users.entries()) {
        data[guildId][userId] = record;
      }
    }

    try {
      fs.writeFileSync(this.storageFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch (err) {
      console.error("[DutyService] Failed to persist duty state:", err);
    } finally {
      this.isSaving = false;
    }
  }

  private getGuildMap(guildId: string): Map<string, StaffShiftRecord> {
    if (!this.dutyMap.has(guildId)) {
      this.dutyMap.set(guildId, new Map());
    }
    return this.dutyMap.get(guildId)!;
  }

  /**
   * Clock in a staff member
   */
  public clockIn(guildId: string, userId: string, userTag: string, note?: string): {
    startedAt: number;
    alreadyOnDuty: boolean;
    note?: string;
  } {
    const guildMap = this.getGuildMap(guildId);
    const existing = guildMap.get(userId);
    const now = Date.now();

    if (existing && existing.isOnDuty) {
      return {
        startedAt: existing.shiftStartedAt || now,
        alreadyOnDuty: true,
        note: existing.note,
      };
    }

    const updated: StaffShiftRecord = {
      userId,
      userTag,
      guildId,
      isOnDuty: true,
      shiftStartedAt: now,
      note: note || undefined,
      totalCompletedShifts: existing?.totalCompletedShifts || 0,
      totalDutyTimeMs: existing?.totalDutyTimeMs || 0,
    };

    guildMap.set(userId, updated);
    this.persistToDisk();

    return {
      startedAt: now,
      alreadyOnDuty: false,
      note,
    };
  }

  /**
   * Clock out a staff member
   */
  public clockOut(guildId: string, userId: string): {
    wasOnDuty: boolean;
    durationMs: number;
    formattedDuration: string;
    totalDutyTimeFormatted: string;
  } {
    const guildMap = this.getGuildMap(guildId);
    const existing = guildMap.get(userId);
    const now = Date.now();

    if (!existing || !existing.isOnDuty || !existing.shiftStartedAt) {
      return {
        wasOnDuty: false,
        durationMs: 0,
        formattedDuration: "0m",
        totalDutyTimeFormatted: this.formatDuration(existing?.totalDutyTimeMs || 0),
      };
    }

    const durationMs = Math.max(0, now - existing.shiftStartedAt);
    const totalDutyTimeMs = (existing.totalDutyTimeMs || 0) + durationMs;

    const updated: StaffShiftRecord = {
      ...existing,
      isOnDuty: false,
      shiftStartedAt: undefined,
      note: undefined,
      lastShiftEndAt: now,
      totalCompletedShifts: (existing.totalCompletedShifts || 0) + 1,
      totalDutyTimeMs,
    };

    guildMap.set(userId, updated);
    this.persistToDisk();

    return {
      wasOnDuty: true,
      durationMs,
      formattedDuration: this.formatDuration(durationMs),
      totalDutyTimeFormatted: this.formatDuration(totalDutyTimeMs),
    };
  }

  /**
   * Retrieves all staff currently on duty in a guild
   */
  public getOnDutyStaff(guildId: string): StaffShiftRecord[] {
    const guildMap = this.getGuildMap(guildId);
    const now = Date.now();
    const result: StaffShiftRecord[] = [];

    for (const record of guildMap.values()) {
      if (record.isOnDuty && record.shiftStartedAt) {
        const elapsedMinutes = Math.floor((now - record.shiftStartedAt) / 60000);
        result.push({
          ...record,
          currentShiftMinutes: elapsedMinutes,
        });
      }
    }

    return result;
  }

  /**
   * Checks if a specific staff member is currently on duty
   */
  public isOnDuty(guildId: string, userId: string): boolean {
    const guildMap = this.getGuildMap(guildId);
    const record = guildMap.get(userId);
    return Boolean(record && record.isOnDuty);
  }

  /**
   * Formats milliseconds into human-readable hours and minutes
   */
  public formatDuration(ms: number): string {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}
