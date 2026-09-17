/**
 * /modmail Slash Command
 * Anonymous Staff Mod-Mail Ticket System
 */

import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from "discord.js";
import { ModMailService, TicketCategory, TicketStatus } from "../services/modMailService.js";
import { RoleService } from "../services/roleService.js";
import { LoggingService } from "../services/loggingService.js";

export const modMailCommand = {
  data: new SlashCommandBuilder()
    .setName("modmail")
    .setDescription("Anonymous Staff Mod-Mail & Private Support System")
    .addSubcommand((sub) =>
      sub
        .setName("create")
        .setDescription("Open a confidential private support ticket with server staff")
        .addStringOption((opt) =>
          opt
            .setName("subject")
            .setDescription("Brief topic or issue summary (e.g. Harassment in #gaming-chat)")
            .setMaxLength(100)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription("Detailed message or context for the moderation team")
            .setMinLength(10)
            .setMaxLength(1500)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("category")
            .setDescription("Category of inquiry")
            .addChoices(
              { name: "Cyberbullying or Harassment", value: "BULLYING_HARASSMENT" },
              { name: "Personal Safety or Privacy Concern", value: "SAFETY_CONCERN" },
              { name: "Infraction Appeal Question", value: "APPEAL_INQUIRY" },
              { name: "General Server Help / Question", value: "GENERAL_HELP" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("reply")
        .setDescription("Staff reply to an active ModMail ticket")
        .addStringOption((opt) =>
          opt
            .setName("ticket_id")
            .setDescription("Ticket ID (e.g. MM-1001)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("message")
            .setDescription("Response text to send to the community member")
            .setMinLength(2)
            .setMaxLength(1500)
            .setRequired(true)
        )
        .addBooleanOption((opt) =>
          opt
            .setName("anonymous")
            .setDescription("Send anonymously as 'AegisMod Staff' (Default: True)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Close and archive an active ModMail ticket")
        .addStringOption((opt) =>
          opt
            .setName("ticket_id")
            .setDescription("Ticket ID (e.g. MM-1001)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Closing resolution note (e.g. Resolved / Investigated)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("Staff: View active ModMail tickets")
        .addStringOption((opt) =>
          opt
            .setName("status")
            .setDescription("Filter by status")
            .addChoices(
              { name: "Open & In Progress", value: "OPEN" },
              { name: "Waiting on Staff", value: "WAITING_STAFF" },
              { name: "Waiting on User", value: "WAITING_USER" },
              { name: "Closed / Resolved", value: "CLOSED" }
            )
        )
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    modMailService: ModMailService,
    roleService: RoleService,
    loggingService: LoggingService
  ) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();

    // 1. Create Ticket (/modmail create) - Available to all members
    if (subcommand === "create") {
      const subject = interaction.options.getString("subject", true);
      const message = interaction.options.getString("message", true);
      const category = (interaction.options.getString("category") || "BULLYING_HARASSMENT") as TicketCategory;

      const existingActive = modMailService.getActiveTicketForUser(interaction.guild.id, interaction.user.id);
      if (existingActive) {
        return interaction.reply({
          content: `⚠️ You already have an open ticket (\`${existingActive.id}\`: *${existingActive.subject}*).\nPlease wait for staff to reply or resolve your existing ticket before opening a new one.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const ticket = modMailService.createTicket(
        interaction.guild.id,
        interaction.user.id,
        interaction.user.tag,
        subject,
        message,
        category
      );

      // Confirm to user privately
      const userEmbed = new EmbedBuilder()
        .setColor(0x6366f1)
        .setTitle(`📬 Mod-Mail Ticket Opened • ${ticket.id}`)
        .setDescription("Your confidential inquiry has been forwarded directly to our moderation team in `#mod-logs`.")
        .addFields(
          { name: "Subject", value: ticket.subject },
          { name: "Initial Message", value: `>>> ${message}` },
          { name: "Privacy Notice", value: "Staff responses will appear in this DM. You may reply back anytime." }
        )
        .setFooter({ text: "AegisMod Anonymous Staff Support" })
        .setTimestamp();

      await interaction.reply({ embeds: [userEmbed], flags: MessageFlags.Ephemeral });

      // Notify staff channel
      await loggingService.logToModLogs(interaction.guild, {
        embeds: [
          new EmbedBuilder()
            .setColor(0xf59e0b)
            .setTitle(`📬 New Mod-Mail Ticket • ${ticket.id}`)
            .setDescription(`A community member has submitted a confidential Mod-Mail inquiry.`)
            .addFields(
              { name: "User", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
              { name: "Category", value: ticket.category, inline: true },
              { name: "Subject", value: ticket.subject, inline: false },
              { name: "Message", value: `>>> ${message}`, inline: false }
            )
            .setFooter({ text: `Reply using /modmail reply ticket_id:${ticket.id} message:...` })
            .setTimestamp(),
        ],
      });

      return;
    }

    // Guard Staff-only subcommands
    if (interaction.member && !roleService.isStaffOrExempt(interaction.member as any)) {
      return interaction.reply({
        content: "⛔ Only authorized moderation staff can reply to, list, or close Mod-Mail tickets.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 2. Staff Reply (/modmail reply)
    if (subcommand === "reply") {
      const ticketId = interaction.options.getString("ticket_id", true).trim().toUpperCase();
      const replyMsg = interaction.options.getString("message", true);
      const isAnon = interaction.options.getBoolean("anonymous") ?? true;

      const result = modMailService.addStaffReply(
        ticketId,
        interaction.user.id,
        interaction.user.tag,
        replyMsg,
        isAnon
      );

      if (!result.success || !result.ticket) {
        return interaction.reply({
          content: `❌ Could not send reply: ${result.error}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Try delivering DM to the user
      const targetUser = await interaction.client.users.fetch(result.ticket.userId).catch(() => null);
      if (targetUser) {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x10b981)
          .setTitle(`📬 Staff Response • Ticket ${result.ticket.id}`)
          .setDescription(`**${isAnon ? "AegisMod Staff" : interaction.user.tag}** wrote:\n\n>>> ${replyMsg}`)
          .setFooter({ text: "Reply back via /modmail reply or by DMing AegisMod" })
          .setTimestamp();

        await targetUser.send({ embeds: [dmEmbed] }).catch(() => null);
      }

      return interaction.reply({
        content: `✅ Sent response to **${result.ticket.userTag}** for ticket \`${ticketId}\` (${isAnon ? "🔒 Sent as Anonymous Staff" : "👤 Sent with your username"}).`,
      });
    }

    // 3. Close Ticket (/modmail close)
    if (subcommand === "close") {
      const ticketId = interaction.options.getString("ticket_id", true).trim().toUpperCase();
      const reason = interaction.options.getString("reason") || "Inquiry resolved by staff.";

      const result = modMailService.closeTicket(ticketId, interaction.user.tag, reason);
      if (!result.success || !result.ticket) {
        return interaction.reply({
          content: `❌ Could not close ticket: ${result.error}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      // Notify user via DM
      const targetUser = await interaction.client.users.fetch(result.ticket.userId).catch(() => null);
      if (targetUser) {
        const closeEmbed = new EmbedBuilder()
          .setColor(0x71717a)
          .setTitle(`🔒 Mod-Mail Ticket Closed • ${ticketId}`)
          .setDescription(`Your ticket regarding **${result.ticket.subject}** has been marked as resolved and closed.`)
          .addFields({ name: "Closing Note", value: reason })
          .setFooter({ text: "Thank you for helping keep our community safe!" })
          .setTimestamp();

        await targetUser.send({ embeds: [closeEmbed] }).catch(() => null);
      }

      return interaction.reply({
        content: `🔒 Ticket \`${ticketId}\` has been closed. Reason: *${reason}*.`,
      });
    }

    // 4. List Tickets (/modmail list)
    if (subcommand === "list") {
      const statusFilter = (interaction.options.getString("status") as TicketStatus) || undefined;
      const list = modMailService.listTickets(interaction.guild.id, statusFilter);

      const embed = new EmbedBuilder()
        .setColor(0x3b82f6)
        .setTitle(`📬 Mod-Mail Ticket Directory • ${interaction.guild.name}`)
        .setDescription(
          list.length === 0
            ? "No tickets found matching the specified filter."
            : `Found **${list.length}** ticket${list.length === 1 ? "" : "s"}:`
        )
        .setTimestamp();

      for (const t of list.slice(0, 10)) {
        embed.addFields({
          name: `${t.id} • ${t.status} (${t.userTag})`,
          value: `**Subject:** ${t.subject}\n**Messages:** ${t.messages.length} | **Updated:** <t:${Math.floor(t.updatedAt / 1000)}:R>`,
          inline: false,
        });
      }

      return interaction.reply({ embeds: [embed] });
    }
  },
};
