import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PayoutStatus } from "@mercurjs/types"
import { createOrderPayoutsWorkflow } from "@mercurjs/core/workflows"

import { PAYOUT_IGNORED_KEY, ResolvedStripeConnectorOptions } from "../types/common"
import { resolvePayoutModule } from "../utils/payout-module"
import { JobContext, JobStats } from "../utils/run-job"

export const TRANSFERS_CHECKPOINT = "transfers"
const BACKLOG_CHUNK = 10
const NEW_CHUNK = 100

type OrderRow = {
  id: string
  created_at: Date | string
  seller?: { id: string; metadata?: Record<string, unknown> | null } | null
}

const isIgnored = (order: OrderRow) => String(order.seller?.metadata?.[PAYOUT_IGNORED_KEY] ?? "") === "true"

const addCounts = (stats: JobStats, counts: Record<string, number>) => {
  for (const [key, value] of Object.entries(counts)) {
    stats[key] = Number(stats[key] ?? 0) + value
  }
}

async function loadOrders(
  container: MedusaContainer,
  filters: Record<string, unknown>,
  take: number
): Promise<OrderRow[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "created_at", "seller.id", "seller.metadata"],
    filters,
    pagination: { take, order: { created_at: "ASC" } },
  })
  return data as unknown as OrderRow[]
}

/**
 * Pays out the given orders through core, leaving out sellers the operator
 * marked as ignored. Returns how many payouts went to the provider.
 */
export async function payOutOrders(
  container: MedusaContainer,
  options: ResolvedStripeConnectorOptions,
  orders: OrderRow[],
  stats: JobStats
): Promise<number> {
  const eligible = orders.filter((order) => !isIgnored(order))
  const ignored = orders.length - eligible.length
  if (ignored) {
    stats.ignored = Number(stats.ignored ?? 0) + ignored
  }
  if (!eligible.length) {
    return 0
  }

  const { result } = await createOrderPayoutsWorkflow(container).run({
    input: {
      order_ids: eligible.map((order) => order.id),
      required_fulfillment_status: options.transfers.requiredFulfillmentStatus,
    },
  })
  addCounts(stats, result.counts)
  return result.payouts.length
}

/**
 * The backlog of held or failed payouts first, ten orders at a time, then
 * orders created since the checkpoint, a hundred at a time.
 */
export async function processTransfers(ctx: JobContext, orderIds?: string[]) {
  const { container, connector, options, stats } = ctx

  if (!options.transfers.enabled) {
    stats.skipped = "transfers disabled"
    return
  }

  if (orderIds?.length) {
    stats.dispatched = await payOutOrders(container, options, await loadOrders(container, { id: orderIds }, orderIds.length), stats)
    return
  }

  const payoutModule = resolvePayoutModule(container)
  const backlog = await payoutModule.listPayouts(
    { status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD], order_id: { $ne: null } },
    { take: null, select: ["order_id"], order: { created_at: "ASC" } }
  )
  const backlogOrderIds = Array.from(new Set(backlog.map((row) => row.order_id as string)))
  stats.backlog = backlogOrderIds.length

  let dispatched = 0
  for (let i = 0; i < backlogOrderIds.length; i += BACKLOG_CHUNK) {
    const chunk = backlogOrderIds.slice(i, i + BACKLOG_CHUNK)
    dispatched += await payOutOrders(container, options, await loadOrders(container, { id: chunk }, chunk.length), stats)
  }

  const checkpoint = await connector.getCheckpoint(TRANSFERS_CHECKPOINT)
  const fresh = await loadOrders(
    container,
    checkpoint ? { created_at: { $gt: new Date(checkpoint) } } : {},
    NEW_CHUNK
  )
  stats.new_orders = fresh.length

  if (fresh.length) {
    const existing = new Set(
      (await payoutModule.listPayouts({ order_id: fresh.map((order) => order.id) }, { take: null, select: ["order_id"] }))
        .map((row) => row.order_id)
    )
    dispatched += await payOutOrders(
      container,
      options,
      fresh.filter((order) => !existing.has(order.id)),
      stats
    )

    const newest = fresh
      .map((order) => new Date(order.created_at).toISOString())
      .sort()
      .pop()
    if (newest && newest !== checkpoint) {
      await connector.setCheckpoint(TRANSFERS_CHECKPOINT, newest)
      stats.checkpoint = newest
    }
  }

  stats.dispatched = dispatched
}
