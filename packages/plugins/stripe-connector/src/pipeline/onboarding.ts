import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SellerStatus } from "@mercurjs/types"
import { ensureSellerPayoutAccountWorkflow } from "@mercurjs/core/workflows"

import { JobContext } from "../utils/run-job"

export const ONBOARDING_CHECKPOINT = "onboarding"
const PAGE = 100

/**
 * Sellers touched since the checkpoint get a provider account and a published
 * onboarding link.
 */
export async function syncOnboarding(ctx: JobContext, sellerIds?: string[]) {
  const { container, connector, options, logger, stats } = ctx

  if (!options.onboarding.enabled) {
    stats.skipped = "onboarding disabled"
    return
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const checkpoint = sellerIds ? null : await connector.getCheckpoint(ONBOARDING_CHECKPOINT)

  const filters: Record<string, unknown> = {
    status: [SellerStatus.OPEN, SellerStatus.PENDING_APPROVAL],
  }
  if (sellerIds) {
    filters.id = sellerIds
  } else if (checkpoint) {
    filters.updated_at = { $gt: new Date(checkpoint) }
  }

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "updated_at"],
    filters,
    pagination: { take: PAGE, order: { updated_at: "ASC" } },
  })

  stats.sellers = sellers.length
  let processed = 0
  let failed = 0
  let newest: string | null = checkpoint

  for (const seller of sellers) {
    const { errors } = await ensureSellerPayoutAccountWorkflow(container).run({
      input: { seller_id: seller.id },
      throwOnError: false,
    })

    if (errors?.length) {
      failed += 1
      logger.error(`Could not prepare payout account for seller ${seller.id}: ${errors[0].error?.message}`)
    } else {
      processed += 1
    }

    const updatedAt = new Date(seller.updated_at).toISOString()
    if (!newest || updatedAt > newest) {
      newest = updatedAt
    }
  }

  stats.processed = processed
  stats.failed = failed

  if (!sellerIds && newest && newest !== checkpoint) {
    await connector.setCheckpoint(ONBOARDING_CHECKPOINT, newest)
    stats.checkpoint = newest
  }
}
