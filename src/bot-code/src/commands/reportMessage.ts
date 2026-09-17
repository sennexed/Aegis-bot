/**
 * Message Context Menu Command: "Report to Staff"
 * Allows community members to right click any message -> Apps -> "Report to Staff".
 * Displays a modal asking for a brief report reason and logs to #mod-logs.
 */

import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  MessageContextMenuCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from "discord.js";

export const reportMessageContextMenu = {
  data: new ContextMenuCommandBuilder()
    .setName("Report to Staff")
    .setType(ApplicationCommandType.Message),

  async execute(interaction: MessageContextMenuCommandInteraction) {
    const targetMessage = interaction.targetMessage;

    // Show a modal to capture report reason
    const modal = new ModalBuilder()
      .setCustomId(`report_modal:${targetMessage.channelId}:${targetMessage.id}:${targetMessage.author.id}`)
      .setTitle("Report Message to Staff");

    const reasonInput = new TextInputBuilder()
      .setCustomId("report_reason")
      .setLabel("Reason for reporting this message:")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("e.g. Harassment, DM solicitation, suspicious link, bullying...")
      .setMinLength(4)
      .setMaxLength(500)
      .setRequired(true);

    const firstActionRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
    modal.addComponents(firstActionRow);

    await interaction.showModal(modal);
  },
};
