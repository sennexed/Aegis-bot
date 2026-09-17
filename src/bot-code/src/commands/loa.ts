/**
 * /loa Slash Command
 * Leave of Absence Management for Moderator Staff
 * Allows staff to request time off, and admins to approve, deny, or list leaves.
 */

import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  GuildMember,
} from "discord.js";
import { LoaService, LoaStatus } from "../services/loaService.js";
import { RoleService } from "../services/roleService.js";
import { LoggingService } from "../services/loggingService.js";

export const loaCommand = {
  data: new SlashCommandBuilder()
    .setName("loa")
    .setDescription("Staff Leave of Absence (LOA) management system")
    .addSubcommand((sub) =>
      sub
        .setName("request")
        .setDescription("Submit a request for a Leave of Absence")
        .addIntegerOption((opt) =>
          opt
            .setName("duration_days")
            .setDescription("Number of days away (1 - 90)")
            .setMinValue(1)
            .setMaxValue(90)
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Reason for leave (e.g. exams, vacation, family, mental health/burnout)")
            .setMinLength(5)
            .setMaxLength(300)
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("list")
        .setDescription("View staff Leave of Absence records")
        .addStringOption((opt) =>
          opt
            .setName("filter")
            .setDescription("Filter by LOA status (default: Currently Active)")
            .addChoices(
              { name: "Currently Active Away", value: "ACTIVE" },
              { name: "Pending Review", value: "PENDING" },
              { name: "All Approved", value: "APPROVED" },
              { name: "All Records", value: "ALL" }
            )
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("approve")
        .setDescription("Approve a pending staff LOA request (Admin only)")
        .addStringOption((opt) =>
          opt
            .setName("loa_id")
            .setDescription("The LOA record ID (e.g. LOA-1001)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("notes")
            .setDescription("Optional approval notes or message to staff")
            .setMaxLength(200)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("deny")
        .setDescription("Deny a pending staff LOA request (Admin only)")
        .addStringOption((opt) =>
          opt
            .setName("loa_id")
            .setDescription("The LOA record ID (e.g. LOA-1001)")
            .setRequired(true)
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("Reason for denial")
            .setMaxLength(200)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("end")
        .setDescription("End an active LOA early upon returning to duty")
        .addStringOption((opt) =>
          opt
            .setName("loa_id")
            .setDescription("LOA ID (leave empty to end your own active LOA)")
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("status")
        .setDescription("Check LOA status for yourself or another moderator")
        .addUserOption((opt) =>
          opt
            .setName("user")
            .setDescription("The staff member to inspect (defaults to you)")
        )
    ),

  async execute(
    interaction: ChatInputCommandInteraction,
    loaService: LoaService,
    roleService: RoleService,
    loggingService: LoggingService
  ) {
    if (!interaction.guild || !interaction.member) return;
    const member = interaction.member as GuildMember;
    const subcommand = interaction.options.getSubcommand();

    // Guard: Only staff members may interact with LOA
    if (!roleService.isStaffOrExempt(member)) {
      return interaction.reply({
        content: "⛔ Only server staff (Moderators and Administrators) can access the LOA system.",
        flags: MessageFlags.Ephemeral,
      });
    }

    // 1. /loa request
    if (subcommand === "request") {
      const days = interaction.options.getInteger("duration_days", true);
      const reason = interaction.options.getString("reason", true);

      const result = loaService.requestLoa(
        interaction.guild.id,
        interaction.user.id,
        interaction.user.tag,
        days,
        reason
      );

      if (!result.success || !result.loa) {
        return interaction.reply({
          content: `⚠️ ${result.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const loa = result.loa;
      const returnTimestamp = Math.floor(loa.endDate / 1000);

      // Reply to staff member
      await interaction.reply({
        content: `✅ **Leave of Absence Requested.**\n• **ID:** \`${loa.id}\`\n• **Duration:** ${days} days (Projected Return: <t:${returnTimestamp}:D>)\n• **Status:** \`PENDING\` review by Senior Staff/Admins.`,
        flags: MessageFlags.Ephemeral,
      });

      // Post notification to #mod-logs for Admins with quick action buttons
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`loa:approve:${loa.id}`)
          .setLabel("Approve LOA")
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`loa:deny:${loa.id}`)
          .setLabel("Deny LOA")
          .setStyle(ButtonStyle.Danger)
      );

      const logEmbed = new EmbedBuilder()
        .setTitle("🌴 Staff Leave of Absence (LOA) Request")
        .setColor(0x3b82f6)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
          { name: "Staff Member", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
          { name: "Requested Duration", value: `${days} Days`, inline: true },
          { name: "Projected Return", value: `<t:${returnTimestamp}:F>`, inline: true },
          { name: "Reason / Notes", value: `>>> ${reason}`, inline: false }
        )
        .setFooter({ text: `Record ID: ${loa.id} • Use buttons below or /loa approve/deny` })
        .setTimestamp();

      const logChannel = await loggingService.ensureLogChannel(interaction.guild);
      await logChannel.send({
        content: "📢 **NEW LOA REQUEST:** Senior Staff please review coverage.",
        embeds: [logEmbed],
        components: [actionRow],
      });

      return;
    }

    // 2. /loa list
    if (subcommand === "list") {
      const filter = (interaction.options.getString("filter") || "ACTIVE") as any;
      const records = loaService.getGuildLoas(
        interaction.guild.id,
        filter === "ALL" ? undefined : filter
      );

      if (records.length === 0) {
        return interaction.reply({
          content: `ℹ️ No Leave of Absence records found for filter \`${filter}\`.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const embed = new EmbedBuilder()
        .setTitle(`🌴 Staff Leave of Absence (LOA) List • Filter: ${filter}`)
        .setColor(0x6366f1)
        .setDescription(
          records
            .slice(0, 15)
            .map((r) => {
              const startT = Math.floor(r.startDate / 1000);
              const endT = Math.floor(r.endDate / 1000);
              const statusEmoji =
                r.status === "APPROVED" ? "🟢" : r.status === "PENDING" ? "🟡" : "⚪";
              return `**${r.id}** • <@${r.userId}> (${r.userTag})\n${statusEmoji} **Status:** \`${r.status}\` | **Duration:** ${r.durationDays}d\n🗓️ **Dates:** <t:${startT}:d> ➔ <t:${endT}:d> (<t:${endT}:R>)\n📝 *"${r.reason.slice(0, 80)}"*`;
            })
            .join("\n\n")
        )
        .setFooter({ text: `Showing ${Math.min(records.length, 15)} of ${records.length} records` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    // 3. /loa approve
    if (subcommand === "approve") {
      if (!roleService.isAdminOrOwner(member)) {
        return interaction.reply({
          content: "⛔ Only Administrators and Server Owners can approve staff LOA requests.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const loaId = interaction.options.getString("loa_id", true);
      const notes = interaction.options.getString("notes") || undefined;

      const result = loaService.approveLoa(
        interaction.guild.id,
        loaId,
        interaction.user.id,
        interaction.user.tag,
        notes
      );

      if (!result.success || !result.loa) {
        return interaction.reply({
          content: `⚠️ ${result.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const loa = result.loa;
      const returnT = Math.floor(loa.endDate / 1000);

      await interaction.reply({
        content: `✅ **LOA Approved:** ${result.message}`,
      });

      // Log to #mod-logs
      const logChannel = await loggingService.ensureLogChannel(interaction.guild);
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("✅ Staff Leave of Absence Approved")
            .setColor(0x10b981)
            .addFields(
              { name: "Staff Member", value: `<@${loa.userId}> (${loa.userTag})`, inline: true },
              { name: "Approved By", value: `<@${interaction.user.id}>`, inline: true },
              { name: "Duration", value: `${loa.durationDays} Days`, inline: true },
              { name: "Return Date", value: `<t:${returnT}:D> (<t:${returnT}:R>)`, inline: true },
              { name: "Notes", value: notes || "None provided", inline: true }
            )
            .setFooter({ text: `LOA ID: ${loa.id}` })
            .setTimestamp(),
        ],
      });

      return;
    }

    // 4. /loa deny
    if (subcommand === "deny") {
      if (!roleService.isAdminOrOwner(member)) {
        return interaction.reply({
          content: "⛔ Only Administrators and Server Owners can deny staff LOA requests.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const loaId = interaction.options.getString("loa_id", true);
      const reason = interaction.options.getString("reason") || undefined;

      const result = loaService.denyLoa(
        interaction.guild.id,
        loaId,
        interaction.user.id,
        interaction.user.tag,
        reason
      );

      if (!result.success || !result.loa) {
        return interaction.reply({
          content: `⚠️ ${result.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      return interaction.reply({
        content: `❌ **LOA Denied:** ${result.message}`,
      });
    }

    // 5. /loa end
    if (subcommand === "end") {
      const loaId = interaction.options.getString("loa_id");
      const targetQuery = loaId || interaction.user.id;

      // If targeting someone else's LOA, must be admin
      if (loaId && !roleService.isAdminOrOwner(member)) {
        return interaction.reply({
          content: "⛔ You can only end your own Leave of Absence. Admin permissions required to end another staff member's LOA.",
          flags: MessageFlags.Ephemeral,
        });
      }

      const result = loaService.endLoa(
        interaction.guild.id,
        targetQuery,
        interaction.user.id,
        interaction.user.tag
      );

      if (!result.success || !result.loa) {
        return interaction.reply({
          content: `⚠️ ${result.message}`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const loa = result.loa;
      await interaction.reply({
        content: `🎉 **Welcome back!** Leave of Absence \`${loa.id}\` for <@${loa.userId}> has been ended. You may now clock in with \`/duty on\`.`,
      });

      const logChannel = await loggingService.ensureLogChannel(interaction.guild);
      await logChannel.send({
        content: `📢 Staff member <@${loa.userId}> (${loa.userTag}) has returned from Leave of Absence (\`${loa.id}\`).`,
      });

      return;
    }

    // 6. /loa status
    if (subcommand === "status") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const activeLoa = loaService.getActiveLoaForUser(interaction.guild.id, targetUser.id);

      if (!activeLoa) {
        return interaction.reply({
          content: `ℹ️ **${targetUser.tag}** does not currently have an active Leave of Absence.`,
          flags: MessageFlags.Ephemeral,
        });
      }

      const endT = Math.floor(activeLoa.endDate / 1000);
      const embed = new EmbedBuilder()
        .setTitle(`🌴 Active Leave of Absence • ${activeLoa.id}`)
        .setColor(0x10b981)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: "Staff Member", value: `<@${activeLoa.userId}> (${activeLoa.userTag})`, inline: true },
          { name: "Duration", value: `${activeLoa.durationDays} Days`, inline: true },
          { name: "Status", value: `\`${activeLoa.status}\``, inline: true },
          { name: "Expected Return", value: `<t:${endT}:D> (<t:${endT}:R>)`, inline: true },
          { name: "Approved By", value: activeLoa.reviewedBy || "Admin", inline: true },
          { name: "Reason", value: `>>> ${activeLoa.reason}`, inline: false }
        )
        .setFooter({ text: "Use /loa end to mark early return." })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }
  },
};
