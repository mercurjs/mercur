import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  MercurModules,
  TransferDTO,
  TransferStatus,
  TransferType,
} from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { decideReversal } from "../utils/transfer-factory"
import { PayoutJobContext } from "../utils/run-payout-job"
import { commissionTotalsFor, dispatchPending } from "./evaluate-order-transfers"

const BACKLOG_CHUNK = 10

type RefundRow = {
  id: string
  amount: BigNumberInput
  raw_amount?: BigNumberInput | null
  created_at: Date | string
}

type OrderWithRefunds = {
  id: string
  total: BigNumberInput
  currency_code: string
  items?: { id: string }[] | null
  shipping_methods?: { id: string }[] | null
  payment_collections?: {
    payments?: { refunds?: RefundRow[] | null }[] | null
  }[] | null
}

async function loadOrdersWithRefunds(container: MedusaContainer, orderIds: string[]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  if (!orderIds.length) return [] as OrderWithRefunds[]
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "total",
      "currency_code",
      "items.id",
      "shipping_methods.id",
      "payment_collections.payments.refunds.id",
      "payment_collections.payments.refunds.amount",
      "payment_collections.payments.refunds.raw_amount",
      "payment_collections.payments.refunds.created_at",
    ],
    filters: { id: orderIds },
  })
  return data as unknown as OrderWithRefunds[]
}

/**
 * PaymentRefundCommand + updateOrderRefundTransfer: every Medusa refund on an
 * order that has an order transfer gets one reversal row, net of commission.
 */
export async function evaluateReversalsForOrders(
  container: MedusaContainer,
  orderIds: string[]
): Promise<{ pending: string[]; counts: Record<string, number> }> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const pending: string[] = []
  const counts: Record<string, number> = {}
  const bump = (key: string) => (counts[key] = (counts[key] ?? 0) + 1)

  if (!orderIds.length) return { pending, counts }

  const orders = await loadOrdersWithRefunds(container, orderIds)
  const commissions = await commissionTotalsFor(container, orders as never)
  const transfers = await service.listTransfers({ order_id: orderIds }, { take: null })

  const orderTransfer = new Map<string, TransferDTO>()
  const reversalByRefund = new Map<string, TransferDTO>()
  for (const row of transfers) {
    if (row.type === TransferType.ORDER) orderTransfer.set(row.order_id as string, row)
    if (row.type === TransferType.REFUND_REVERSAL && row.refund_id) reversalByRefund.set(row.refund_id, row)
  }

  for (const order of orders) {
    const original = orderTransfer.get(order.id)
    if (!original) {
      continue
    }
    const refunds = (order.payment_collections ?? [])
      .flatMap((c) => c.payments ?? [])
      .flatMap((p) => p.refunds ?? [])

    for (const refund of refunds) {
      const existing = reversalByRefund.get(refund.id)
      if (existing && ![TransferStatus.FAILED, TransferStatus.ON_HOLD].includes(existing.status)) {
        continue
      }

      const decision = decideReversal({
        refund_id: refund.id,
        refund_amount: refund.raw_amount ?? refund.amount,
        refund_canceled: false,
        order_total: order.total,
        commission_total: commissions.get(order.id) ?? 0,
        order_transfer: {
          id: original.id,
          status: original.status,
          provider_transfer_id: original.provider_transfer_id,
        },
      })

      if (existing) {
        const updated = await service.updateTransfers({
          id: existing.id,
          status: decision.status,
          status_reason: decision.status_reason,
          amount: Number(decision.amount),
        })
        bump(updated.status)
        if (updated.status === TransferStatus.PENDING) pending.push(updated.id)
        continue
      }

      const created = await service.createTransfers({
        account_id: original.account_id,
        provider_id: original.provider_id,
        type: TransferType.REFUND_REVERSAL,
        order_id: order.id,
        reverses_transfer_id: original.id,
        refund_id: refund.id,
        amount: Number(decision.amount),
        currency_code: order.currency_code,
        status: decision.status,
        status_reason: decision.status_reason,
        source_created_at: new Date(refund.created_at),
      })
      bump(created.status)
      if (created.status === TransferStatus.PENDING) pending.push(created.id)
    }
  }

  return { pending, counts }
}

export async function processReversals(ctx: PayoutJobContext, orderIds?: string[]) {
  const { container, service, stats } = ctx
  const options = service.getOptions()

  if (!options.reversals.enabled) {
    stats.skipped = "reversals disabled"
    return
  }

  let targetOrderIds: string[]
  if (orderIds?.length) {
    targetOrderIds = orderIds
  } else {
    const backlog = await service.listTransfers(
      { type: TransferType.REFUND_REVERSAL, status: [TransferStatus.FAILED, TransferStatus.ON_HOLD] },
      { take: null }
    )
    const withTransfer = await service.listTransfers(
      { type: TransferType.ORDER, status: TransferStatus.CREATED },
      { take: null, select: ["order_id"] }
    )
    targetOrderIds = Array.from(
      new Set([...backlog, ...withTransfer].map((row) => row.order_id as string).filter(Boolean))
    )
    stats.backlog = backlog.length
  }

  let dispatched = 0
  for (let i = 0; i < targetOrderIds.length; i += BACKLOG_CHUNK) {
    const { pending, counts } = await evaluateReversalsForOrders(
      container,
      targetOrderIds.slice(i, i + BACKLOG_CHUNK)
    )
    for (const [key, value] of Object.entries(counts)) {
      stats[key] = Number(stats[key] ?? 0) + value
    }
    dispatched += await dispatchPending(container, pending)
  }

  stats.orders = targetOrderIds.length
  stats.dispatched = dispatched
}
