/**
 * messageDelete Event Listener
 * Catches message deletions and writes comprehensive audit logs to #mod-logs.
 */

import { Message, PartialMessage } from "discord.js";
import { LoggingService } from "../services/loggingService.js";

export async function handleMessageDelete(
  message: Message | PartialMessage,
  loggingService: LoggingService
) {
  if (message.partial) {
    // If not cached, we cannot recover content but can still log deletion if desirable
    return;
  }

  const fullMessage = message as Message;
  if (fullMessage.author?.bot || !fullMessage.guild) return;

  await loggingService.logMessageDelete(fullMessage);
}
