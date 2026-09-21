/**
 * Anonymous Staff Mod-Mail Ticket System
 * Allows community members to privately report issues, ask safety questions,
 * and communicate directly with staff. Protects user privacy and allows staff
 * to answer anonymously as "AegisMod Staff".
 */

import fs from "fs";
import path from "path";

export interface ModMailMessage {
  id: string;
  sender: "USER" | "STAFF";
  authorId: string;
  authorTag: string;
  content: string;
  timestamp: number;
  isAnonymous?: boolean;
}

export type TicketStatus = "OPEN" | "WAITING_USER" | "WAITING_STAFF" | "RESOLVED" | "CLOSED";
export type TicketCategory = "BULLYING_HARASSMENT" | "SAFETY_CONCERN" | "APPEAL_INQUIRY" | "GENERAL_HELP";

export interface ModMailTicket {
  id: string;
  guildId: string;
  userId: string;
  userTag: string;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
  closedBy?: string;
  closeReason?: string;
  threadId?: string;
  messages: ModMailMessage[];
}

export class ModMailService {
  private tickets = new Map<string, ModMailTicket>();
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
    this.storageFilePath = path.join(dir, "modmail_tickets.json");
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.storageFilePath)) {
        const raw = fs.readFileSync(this.storageFilePath, "utf8");
        const list: ModMailTicket[] = JSON.parse(raw);
        for (const ticket of list) {
          this.tickets.set(ticket.id, ticket);
        }
      }
    } catch (err) {
      console.error("[ModMailService] Failed to load tickets from disk:", err);
    }
  }

  private persistToDisk() {
    if (this.isSaving) return;
    this.isSaving = true;

    try {
      const list = Array.from(this.tickets.values());
      fs.writeFileSync(this.storageFilePath, JSON.stringify(list, null, 2), "utf8");
    } catch (err) {
      console.error("[ModMailService] Failed to persist tickets:", err);
    } finally {
      this.isSaving = false;
    }
  }

  /**
   * Generates next ticket ID: e.g. MM-1042
   */
  private generateTicketId(): string {
    const count = this.tickets.size + 1;
    return `MM-${1000 + count}`;
  }

  /**
   * Creates a new ModMail ticket initiated by a community member
   */
  public createTicket(
    guildId: string,
    userId: string,
    userTag: string,
    subject: string,
    initialMessage: string,
    category: TicketCategory = "BULLYING_HARASSMENT"
  ): ModMailTicket {
    const id = this.generateTicketId();
    const now = Date.now();

    const initialMsg: ModMailMessage = {
      id: `MSG-1`,
      sender: "USER",
      authorId: userId,
      authorTag: userTag,
      content: initialMessage,
      timestamp: now,
    };

    const ticket: ModMailTicket = {
      id,
      guildId,
      userId,
      userTag,
      subject: subject.slice(0, 100),
      category,
      status: "OPEN",
      createdAt: now,
      updatedAt: now,
      messages: [initialMsg],
    };

    this.tickets.set(id, ticket);
    this.persistToDisk();
    return ticket;
  }

  /**
   * Universal message appender supporting DM listener or staff calls
   */
  public addMessage(
    guildId: string,
    ticketId: string,
    data: { senderId: string; senderTag: string; content: string; isStaff: boolean }
  ): { success: boolean; message?: ModMailMessage; ticket?: ModMailTicket; error?: string } {
    if (data.isStaff) {
      return this.addStaffReply(ticketId, data.senderId, data.senderTag, data.content, false);
    } else {
      return this.addUserReply(ticketId, data.senderId, data.content);
    }
  }

  /**
   * Appends a message from staff to the ticket
   */
  public addStaffReply(
    ticketId: string,
    staffUserId: string,
    staffTag: string,
    content: string,
    isAnonymous: boolean = true
  ): { success: boolean; message?: ModMailMessage; ticket?: ModMailTicket; error?: string } {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      return { success: false, error: "This ticket is closed." };
    }

    const msg: ModMailMessage = {
      id: `MSG-${ticket.messages.length + 1}`,
      sender: "STAFF",
      authorId: staffUserId,
      authorTag: isAnonymous ? "AegisMod Staff" : staffTag,
      content,
      timestamp: Date.now(),
      isAnonymous,
    };

    ticket.messages.push(msg);
    ticket.status = "WAITING_USER";
    ticket.updatedAt = Date.now();

    this.persistToDisk();
    return { success: true, message: msg, ticket };
  }

  /**
   * Appends a reply from the ticket owner user
   */
  public addUserReply(
    ticketId: string,
    userId: string,
    content: string
  ): { success: boolean; message?: ModMailMessage; ticket?: ModMailTicket; error?: string } {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    if (ticket.userId !== userId) {
      return { success: false, error: "Unauthorized: only the ticket creator can reply." };
    }

    if (ticket.status === "CLOSED") {
      return { success: false, error: "This ticket is closed. Please open a new ticket." };
    }

    const msg: ModMailMessage = {
      id: `MSG-${ticket.messages.length + 1}`,
      sender: "USER",
      authorId: userId,
      authorTag: ticket.userTag,
      content,
      timestamp: Date.now(),
    };

    ticket.messages.push(msg);
    ticket.status = "WAITING_STAFF";
    ticket.updatedAt = Date.now();

    this.persistToDisk();
    return { success: true, message: msg, ticket };
  }

  /**
   * Closes a ticket with reason and timestamp
   */
  public closeTicket(
    ticketId: string,
    closedByTag: string,
    reason: string = "Resolved"
  ): { success: boolean; ticket?: ModMailTicket; error?: string } {
    const ticket = this.tickets.get(ticketId);
    if (!ticket) {
      return { success: false, error: "Ticket not found." };
    }

    ticket.status = "CLOSED";
    ticket.closedAt = Date.now();
    ticket.closedBy = closedByTag;
    ticket.closeReason = reason;
    ticket.updatedAt = Date.now();

    this.persistToDisk();
    return { success: true, ticket };
  }

  /**
   * Looks up the currently active ticket for a given user in a guild
   */
  public getActiveTicketForUser(guildId: string, userId: string): ModMailTicket | undefined {
    return Array.from(this.tickets.values()).find(
      (t) => t.guildId === guildId && t.userId === userId && t.status !== "CLOSED"
    );
  }

  /**
   * Retrieves ticket by ID
   */
  public getTicket(ticketId: string): ModMailTicket | undefined {
    return this.tickets.get(ticketId);
  }

  /**
   * Lists tickets with optional status filtering
   */
  public listTickets(guildId: string, statusFilter?: TicketStatus): ModMailTicket[] {
    return Array.from(this.tickets.values())
      .filter((t) => t.guildId === guildId && (!statusFilter || t.status === statusFilter))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
