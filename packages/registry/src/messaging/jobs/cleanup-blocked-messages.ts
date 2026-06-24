import { MedusaContainer } from "@medusajs/framework/types"

import { MESSAGING_FILTERS_MODULE } from "../modules/messaging-filters"
import type MessagingFiltersModuleService from "../modules/messaging-filters/service"

const RETENTION_DAYS = 30

export default async function cleanupBlockedMessages(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const service = container.resolve<MessagingFiltersModuleService>(
    MESSAGING_FILTERS_MODULE
  )

  try {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    // List old blocked message logs
    const oldLogs = await service.listBlockedMessageLogs(
      {
        created_at: { $lt: cutoffDate },
      },
      { take: 1000, select: ["id"] }
    )

    if (!oldLogs || oldLogs.length === 0) {
      logger.debug("Messaging: cleanup-blocked-messages — nothing to clean up")
      return
    }

    const ids = oldLogs.map((log: any) => log.id)

    await service.deleteBlockedMessageLogs(ids)

    logger.info(
      `Messaging: cleanup-blocked-messages deleted ${ids.length} log(s) older than ${RETENTION_DAYS} days`
    )
  } catch (err) {
    logger.error(
      `Messaging: cleanup-blocked-messages error: ${(err as Error).message}`
    )
  }
}

export const config = {
  name: "messaging-cleanup-blocked-messages",
  schedule: "0 4 * * *", // Daily at 4 AM
}
