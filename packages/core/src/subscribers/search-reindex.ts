import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import { reindexAll, SEARCH_REINDEX_EVENT } from "../modules/search"

export default async function searchReindexHandler({
  container,
}: SubscriberArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    await reindexAll(container)
  } catch (error) {
    logger.error("Full search reindex failed:", error as Error)
    throw error
  }
}

export const config: SubscriberConfig = {
  event: SEARCH_REINDEX_EVENT,
  context: {
    subscriberId: "search-reindex-handler",
  },
}
