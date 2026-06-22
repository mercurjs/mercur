import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function reconcileUnreadCounts(
  container: MedusaContainer
) {
  const logger = container.resolve("logger")
  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  try {
    // Single query: compute actual unread counts for ALL conversations at once
    const BATCH_SIZE = 500
    let totalCorrected = 0
    let offset = 0

    // Process in batches to avoid unbounded result sets
    while (true) {
      const { rows: actualCounts } = await pgConnection.raw(`
        SELECT
          c.id,
          c.unread_count_customer AS stored_customer,
          c.unread_count_seller AS stored_seller,
          COALESCE(SUM(CASE WHEN m.sender_type = 'seller' AND m.read_at IS NULL THEN 1 ELSE 0 END), 0)::int AS actual_customer,
          COALESCE(SUM(CASE WHEN m.sender_type = 'customer' AND m.read_at IS NULL THEN 1 ELSE 0 END), 0)::int AS actual_seller
        FROM conversation c
        LEFT JOIN message m ON m.conversation_id = c.id AND m.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.unread_count_customer, c.unread_count_seller
        HAVING
          c.unread_count_customer != COALESCE(SUM(CASE WHEN m.sender_type = 'seller' AND m.read_at IS NULL THEN 1 ELSE 0 END), 0)
          OR c.unread_count_seller != COALESCE(SUM(CASE WHEN m.sender_type = 'customer' AND m.read_at IS NULL THEN 1 ELSE 0 END), 0)
        ORDER BY c.id
        LIMIT ?
        OFFSET ?
      `, [BATCH_SIZE, offset])

      if (!actualCounts || actualCounts.length === 0) break

      for (const row of actualCounts) {
        await pgConnection.raw(`
          UPDATE conversation
          SET unread_count_customer = ?, unread_count_seller = ?, updated_at = NOW()
          WHERE id = ?
        `, [row.actual_customer, row.actual_seller, row.id])
      }

      totalCorrected += actualCounts.length
      offset += BATCH_SIZE

      if (actualCounts.length < BATCH_SIZE) break
    }

    if (totalCorrected === 0) {
      logger.debug("Messaging: reconcile-unread-counts — no drift detected")
      return
    }

    logger.info(
      `Messaging: reconcile-unread-counts corrected ${totalCorrected} conversation(s)`
    )
  } catch (err) {
    logger.error(
      `Messaging: reconcile-unread-counts error: ${(err as Error).message}`
    )
  }
}

export const config = {
  name: "messaging-reconcile-unread-counts",
  schedule: "0 3 * * *", // Daily at 3 AM
}
