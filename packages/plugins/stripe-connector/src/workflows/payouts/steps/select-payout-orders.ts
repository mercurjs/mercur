import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { PAYOUT_IGNORED_KEY } from "../../../types/common"
import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"

export const PAYOUTS_CHECKPOINT = "transfers"
const BACKLOG_PAGE = 100
const NEW_PAGE = 100

type OrderRow = {
  id: string
  created_at: Date | string
  seller?: { metadata?: Record<string, unknown> | null } | null
}

const isIgnored = (order: OrderRow) => String(order.seller?.metadata?.[PAYOUT_IGNORED_KEY] ?? "") === "true"

export type SelectPayoutOrdersStepOutput = {
  order_ids: string[]
  checkpoint: string | null
  stats: Record<string, number | string>
}

export const selectPayoutOrdersStepId = "select-stripe-payout-orders"

/**
 * The orders to pay out this run: the given ones, or the oldest held or
 * failed payouts plus the orders created since the checkpoint. Sellers the
 * operator ignores are left out.
 */
export const selectPayoutOrdersStep = createStep(
  selectPayoutOrdersStepId,
  async (input: { order_ids?: string[] }, { container }) => {
    const connector = resolveConnector(container)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const stats: Record<string, number | string> = {}

    if (!connector.getOptions().transfers.enabled) {
      stats.skipped = "transfers disabled"
      return new StepResponse<SelectPayoutOrdersStepOutput>({ order_ids: [], checkpoint: null, stats })
    }

    const loadOrders = async (filters: Record<string, unknown>, take: number) => {
      const { data } = await query.graph({
        entity: "order",
        fields: ["id", "created_at", "seller.metadata"],
        filters,
        pagination: { take, order: { created_at: "ASC" } },
      })
      return data as unknown as OrderRow[]
    }

    let orders: OrderRow[]
    let checkpoint: string | null = null

    if (input.order_ids?.length) {
      orders = await loadOrders({ id: input.order_ids }, input.order_ids.length)
    } else {
      const backlog = await resolvePayoutModule(container).listPayouts(
        { status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD], order_id: { $ne: null } },
        { take: BACKLOG_PAGE, select: ["order_id"], order: { created_at: "ASC" } }
      )
      const backlogIds = backlog.map((row) => row.order_id as string)
      stats.backlog = backlogIds.length

      const previous = await connector.getCheckpoint(PAYOUTS_CHECKPOINT)
      const fresh = await loadOrders(previous ? { created_at: { $gt: new Date(previous) } } : {}, NEW_PAGE)
      stats.new_orders = fresh.length
      checkpoint = fresh.length ? new Date(fresh[fresh.length - 1].created_at).toISOString() : null

      const backlogOrders = backlogIds.length ? await loadOrders({ id: backlogIds }, backlogIds.length) : []
      const seen = new Set<string>()
      orders = [...backlogOrders, ...fresh].filter((order) => !seen.has(order.id) && !!seen.add(order.id))
    }

    const eligible = orders.filter((order) => !isIgnored(order))
    if (orders.length !== eligible.length) {
      stats.ignored = orders.length - eligible.length
    }

    return new StepResponse<SelectPayoutOrdersStepOutput>({
      order_ids: eligible.map((order) => order.id),
      checkpoint,
      stats,
    })
  }
)
