import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MathBN } from "@medusajs/framework/utils"
import {
  MercurModules,
  TransferDTO,
  TransferStatus,
  TransferType,
} from "@mercurjs/types"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import {
  TransferAccountState,
  TransferPaymentState,
  decideOrderTransfer,
} from "../utils/transfer-factory"
import { PayoutJobContext } from "../utils/run-payout-job"
import { processTransferWorkflow } from "../workflows/process-transfer"

export const TRANSFERS_CHECKPOINT = "transfers"
const BACKLOG_CHUNK = 10
const NEW_CHUNK = 100

const ORDER_FIELDS = [
  "id",
  "status",
  "canceled_at",
  "fulfillment_status",
  "total",
  "tax_total",
  "currency_code",
  "created_at",
  "items.id",
  "shipping_methods.id",
  "seller.id",
  "seller.payout_account.id",
  "seller.payout_account.provider_id",
  "seller.payout_account.payouts_enabled",
  "seller.payout_account.ignored",
  "payment_collections.id",
  "payment_collections.payments.id",
  "payment_collections.payments.provider_id",
  "payment_collections.payments.amount",
  "payment_collections.payments.raw_amount",
  "payment_collections.payments.captured_at",
  "payment_collections.payments.canceled_at",
  "payment_collections.payments.data",
  "payment_collections.payments.captures.amount",
  "payment_collections.payments.captures.raw_amount",
  "payment_collections.payments.refunds.amount",
  "payment_collections.payments.refunds.raw_amount",
]

type OrderRow = {
  id: string
  status: string
  canceled_at: Date | string | null
  fulfillment_status: string | null
  total: BigNumberInput
  tax_total: BigNumberInput | null
  currency_code: string
  created_at: Date | string
  items?: { id: string }[] | null
  shipping_methods?: { id: string }[] | null
  seller?: {
    id: string
    payout_account?: {
      id: string
      provider_id: string
      payouts_enabled: boolean
      ignored: boolean
    } | null
  } | null
  payment_collections?: {
    id: string
    payments?: {
      id: string
      provider_id: string
      amount: BigNumberInput
      raw_amount?: BigNumberInput | null
      captured_at: Date | string | null
      canceled_at: Date | string | null
      data: Record<string, unknown> | null
      captures?: { amount: BigNumberInput; raw_amount?: BigNumberInput | null }[] | null
      refunds?: { amount: BigNumberInput; raw_amount?: BigNumberInput | null }[] | null
    }[] | null
  }[] | null
}

const sum = (rows: { amount: BigNumberInput; raw_amount?: BigNumberInput | null }[] | null | undefined) =>
  (rows ?? []).reduce<BigNumberInput>((acc, row) => MathBN.add(acc, row.raw_amount ?? row.amount), 0)

export function paymentStateOf(order: OrderRow): TransferPaymentState {
  const payments = (order.payment_collections ?? []).flatMap((c) => c.payments ?? [])
  const payment = payments.find((p) => !p.canceled_at) ?? payments[0]
  if (!payment) {
    return null
  }
  const capturedTotal = sum(payment.captures)
  const refundedTotal = sum(payment.refunds)
  const captured = !!payment.captured_at || MathBN.gt(capturedTotal, 0)
  const fullyRefunded = captured && MathBN.gte(refundedTotal, MathBN.gt(capturedTotal, 0) ? capturedTotal : payment.raw_amount ?? payment.amount)
  return {
    id: payment.id,
    provider_id: payment.provider_id,
    captured,
    canceled: !!payment.canceled_at,
    fully_refunded: fullyRefunded,
    data: (payment.data ?? {}) as Record<string, unknown>,
  }
}

export async function commissionTotalsFor(
  container: MedusaContainer,
  orders: OrderRow[]
): Promise<Map<string, BigNumberInput>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const totals = new Map<string, BigNumberInput>()
  const itemOwner = new Map<string, string>()
  const shippingOwner = new Map<string, string>()

  for (const order of orders) {
    totals.set(order.id, 0)
    for (const item of order.items ?? []) itemOwner.set(item.id, order.id)
    for (const method of order.shipping_methods ?? []) shippingOwner.set(method.id, order.id)
  }

  if (!itemOwner.size && !shippingOwner.size) {
    return totals
  }

  const { data: lines } = await query.graph({
    entity: "commission_line",
    fields: ["amount", "item_id", "shipping_method_id"],
    filters: {
      $or: [
        { item_id: Array.from(itemOwner.keys()) },
        { shipping_method_id: Array.from(shippingOwner.keys()) },
      ],
    },
  })

  for (const line of lines) {
    const orderId =
      (line.item_id && itemOwner.get(line.item_id)) ||
      (line.shipping_method_id && shippingOwner.get(line.shipping_method_id))
    if (!orderId) continue
    totals.set(orderId, MathBN.add(totals.get(orderId) ?? 0, line.amount ?? 0))
  }

  return totals
}

async function loadOrders(container: MedusaContainer, filters: Record<string, unknown>, take: number, orderBy = "ASC") {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ORDER_FIELDS,
    filters,
    pagination: { take, order: { created_at: orderBy } },
  })
  return data as unknown as OrderRow[]
}

/**
 * Builds or re-evaluates the order (and tax) transfer rows for the given
 * orders. Returns the ids
 * that are ready to dispatch.
 */
export async function upsertOrderTransfers(
  container: MedusaContainer,
  orders: OrderRow[],
  existing: Map<string, TransferDTO[]>
): Promise<{ pending: string[]; counts: Record<string, number> }> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const options = service.getOptions()
  const commissions = await commissionTotalsFor(container, orders)
  const pending: string[] = []
  const counts: Record<string, number> = {}
  const bump = (key: string) => (counts[key] = (counts[key] ?? 0) + 1)

  for (const order of orders) {
    const accountRow = order.seller?.payout_account ?? null
    const account: TransferAccountState = accountRow
      ? { id: accountRow.id, payouts_enabled: accountRow.payouts_enabled, ignored: accountRow.ignored }
      : null
    const payment = paymentStateOf(order)

    const decision = decideOrderTransfer({
      order: {
        id: order.id,
        seller_id: order.seller?.id ?? "",
        status: order.status,
        canceled_at: order.canceled_at,
        fulfillment_status: order.fulfillment_status,
        total: order.total,
        tax_total: order.tax_total,
        currency_code: order.currency_code,
        created_at: order.created_at,
      },
      account,
      payment,
      commission_total: commissions.get(order.id) ?? 0,
      required_fulfillment_status: options.transfers.requiredFulfillmentStatus,
      tax_split: !!options.transfers.taxSplit,
    })

    const rows = existing.get(order.id) ?? []
    const orderRow = rows.find((row) => row.type === TransferType.ORDER)
    const data = {
      source_payment: payment ? { id: payment.id, provider_id: payment.provider_id, data: payment.data } : null,
      transfer_group: order.id,
    }

    const plan: { type: TransferType; amount: BigNumberInput; existing?: TransferDTO }[] = [
      { type: TransferType.ORDER, amount: decision.amount, existing: orderRow },
    ]
    if (options.transfers.taxSplit && decision.status === TransferStatus.PENDING && MathBN.gt(decision.tax_amount, 0)) {
      plan.push({
        type: TransferType.TAX,
        amount: decision.tax_amount,
        existing: rows.find((row) => row.type === TransferType.TAX),
      })
    }

    for (const item of plan) {
      if (item.existing) {
        const retriable = [TransferStatus.FAILED, TransferStatus.ON_HOLD].includes(item.existing.status)
        if (!retriable) {
          continue
        }
        const updated = await service.updateTransfers({
          id: item.existing.id,
          status: decision.status,
          status_reason: decision.status_reason,
          amount: Number(item.amount),
          account_id: account?.id ?? item.existing.account_id,
          source_payment_id: payment?.id ?? null,
          data,
        })
        bump(updated.status)
        if (updated.status === TransferStatus.PENDING) pending.push(updated.id)
        continue
      }

      if (!account && decision.status === TransferStatus.ON_HOLD) {
        // No account row to attach the transfer to yet; the next run picks the order up again.
        bump("awaiting_account")
        continue
      }

      const created = await service.createTransfers({
        account_id: account?.id as string,
        provider_id: accountRow?.provider_id ?? service.getDefaultProviderId(),
        type: item.type,
        order_id: order.id,
        amount: Number(item.amount),
        currency_code: order.currency_code,
        status: decision.status,
        status_reason: decision.status_reason,
        source_payment_id: payment?.id ?? null,
        source_created_at: new Date(order.created_at),
        data,
      })
      bump(created.status)
      if (created.status === TransferStatus.PENDING) pending.push(created.id)
    }
  }

  return { pending, counts }
}

async function existingTransfersFor(service: PayoutModuleService, orderIds: string[]) {
  const map = new Map<string, TransferDTO[]>()
  if (!orderIds.length) return map
  const rows = await service.listTransfers(
    { order_id: orderIds, type: [TransferType.ORDER, TransferType.TAX] },
    { take: null }
  )
  for (const row of rows) {
    const list = map.get(row.order_id as string) ?? []
    list.push(row)
    map.set(row.order_id as string, list)
  }
  return map
}

export async function dispatchPending(container: MedusaContainer, ids: string[]) {
  let dispatched = 0
  for (const id of ids) {
    await processTransferWorkflow(container).run({ input: { transfer_id: id }, throwOnError: false })
    dispatched += 1
  }
  return dispatched
}

export async function evaluateOrders(container: MedusaContainer, orderIds: string[]) {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const orders = await loadOrders(container, { id: orderIds }, orderIds.length || 1)
  const existing = await existingTransfersFor(service, orderIds)
  const { pending, counts } = await upsertOrderTransfers(container, orders, existing)
  const dispatched = await dispatchPending(container, pending)
  return { counts, dispatched }
}

/**
 * PaymentSplitCommand: the backlog of retriable transfers first, ten at a
 * time, then orders created since the checkpoint, a hundred at a time.
 */
export async function processTransfers(ctx: PayoutJobContext, orderIds?: string[]) {
  const { container, service, stats } = ctx
  const options = service.getOptions()

  if (!options.transfers.enabled) {
    stats.skipped = "transfers disabled"
    return
  }

  if (orderIds?.length) {
    const result = await evaluateOrders(container, orderIds)
    Object.assign(stats, result.counts, { dispatched: result.dispatched })
    return
  }

  const backlog = await service.listTransfers(
    { type: [TransferType.ORDER, TransferType.TAX], status: [TransferStatus.FAILED, TransferStatus.ON_HOLD] },
    { take: null, order: { created_at: "ASC" } }
  )
  const backlogOrderIds = Array.from(new Set(backlog.map((row) => row.order_id as string)))
  stats.backlog = backlogOrderIds.length

  let dispatched = 0
  for (let i = 0; i < backlogOrderIds.length; i += BACKLOG_CHUNK) {
    const result = await evaluateOrders(container, backlogOrderIds.slice(i, i + BACKLOG_CHUNK))
    dispatched += result.dispatched
  }

  const checkpoint = await service.getCheckpoint(TRANSFERS_CHECKPOINT)
  const filters: Record<string, unknown> = {}
  if (checkpoint) {
    filters.created_at = { $gt: new Date(checkpoint) }
  }

  const fresh = await loadOrders(container, filters, NEW_CHUNK)
  const freshIds = fresh.map((order) => order.id)
  stats.new_orders = fresh.length

  if (fresh.length) {
    const existing = await existingTransfersFor(service, freshIds)
    const toEvaluate = fresh.filter((order) => !existing.has(order.id))
    const { pending, counts } = await upsertOrderTransfers(container, toEvaluate, existing)
    Object.assign(stats, counts)
    dispatched += await dispatchPending(container, pending)

    const newest = fresh
      .map((order) => new Date(order.created_at).toISOString())
      .sort()
      .pop()
    if (newest && newest !== checkpoint) {
      await service.setCheckpoint(TRANSFERS_CHECKPOINT, newest)
      stats.checkpoint = newest
    }
  }

  stats.dispatched = dispatched
}
