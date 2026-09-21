/**
 * messageUpdate Event Listener
 * Detects edited messages, checks if edited text bypasses moderation, and logs the diff to #mod-logs.
 */

import { Message, PartialMessage } from "discord.js";
import { LoggingService } from "../services/loggingService.js";
import { handleMessageCreate } from "./messageCreate.js";
import { TriageService } from "../services/triageService.js";
import { GeminiModerationService } from "../services/geminiModerationService.js";
import { RoleService } from "../services/roleService.js";
import { AutoModService } from "../services/autoModService.js";
import { ChannelPolicyService } from "../services/channelPolicyService.js";
import { TraditionalModService } from "../services/traditionalModService.js";

export async function handleMessageUpdate(
  oldMessage: Message | PartialMessage,
  newMessage: Message | PartialMessage,
  loggingService: LoggingService,
  triageService: TriageService,
  geminiService: GeminiModerationService,
  roleService: RoleService,
  autoModService?: AutoModService,
  channelPolicyService?: ChannelPolicyService,
  traditionalModService?: TraditionalModService
) {
  // If partial, try to fetch full message
  if (newMessage.partial) {
    try {
      await newMessage.fetch();
    } catch {
      return;
    }
  }

  const fullNewMessage = newMessage as Message;
  const fullOldMessage = (oldMessage.partial ? null : oldMessage) as Message | null;

  if (fullNewMessage.author?.bot || !fullNewMessage.guild) return;
  if (fullOldMessage && fullOldMessage.content === fullNewMessage.content) return;

  // 1. Log the edit audit trail to #mod-logs
  if (fullOldMessage) {
    await loggingService.logMessageEdit(fullOldMessage, fullNewMessage);
  }

  // 2. Re-scan edited message through moderation pipeline to prevent bypasses
  await handleMessageCreate(
    fullNewMessage,
    triageService,
    geminiService,
    loggingService,
    roleService,
    autoModService,
    channelPolicyService,
    traditionalModService
  );
}
