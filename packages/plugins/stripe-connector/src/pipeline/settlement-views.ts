import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { SettlementDTO, SettlementLineType } from "../types/common"
import { SettlementDetail, SettlementLine, SettlementListItem, SettlementSeller } from "../types/http"
import { providerIdOf } from "../lib/provider-data"
import { resolveConnector, resolvePayoutModule } from "../utils/payout-module"

type ListOptions = {
  filters: Record<string, unknown>
  skip: number
  take: number
}

async function sellersByAccount(container: MedusaContainer, accountIds: string[]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const map = new Map<string, SettlementSeller>()
  if (!accountIds.length) return map
  const { data } = await query.graph({
    entity: "payout_account",
    fields: ["id", "seller.id", "seller.name", "seller.handle"],
    filters: { id: accountIds },
  })
  for (const row of data) {
    if (row.seller) {
      map.set(row.id, { id: row.seller.id, name: row.seller.name, handle: row.seller.handle })
    }
  }
  return map
}

async function decorate(container: MedusaContainer, settlements: SettlementDTO[]): Promise<SettlementListItem[]> {
  if (!settlements.length) return []
  const connector = resolveConnector(container)

  const sellers = await sellersByAccount(container, Array.from(new Set(settlements.map((s) => s.account_id))))
  const lines = await connector.listSettlementLines(
    { settlement_id: settlements.map((s) => s.id) },
    { take: null, select: ["id", "type", "settlement_id"] }
  )

  return settlements.map((settlement) => {
    const own = lines.filter((line) => line.settlement_id === settlement.id)
    return {
      ...settlement,
      seller: sellers.get(settlement.account_id) ?? null,
      payout_count: own.filter((line) => line.type === SettlementLineType.PAYOUT).length,
      reversal_count: own.filter((line) => line.type === SettlementLineType.REVERSAL).length,
      adjustment_count: own.filter(
        (line) =>
          line.type === SettlementLineType.ADJUSTMENT_CREDIT || line.type === SettlementLineType.ADJUSTMENT_DEBIT
      ).length,
    }
  })
}

export async function listSettlements(container: MedusaContainer, options: ListOptions) {
  const connector = resolveConnector(container)
  const [rows, count] = await connector.listAndCountSettlements(options.filters, {
    skip: options.skip,
    take: options.take,
    order: { period_end: "DESC" },
  })
  const settlements = await decorate(container, rows as unknown as SettlementDTO[])
  return { settlements, count }
}

export async function retrieveSettlement(
  container: MedusaContainer,
  id: string,
  filters: Record<string, unknown> = {}
): Promise<SettlementDetail> {
  const connector = resolveConnector(container)
  const payoutModule = resolvePayoutModule(container)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const [row] = await connector.listSettlements({ id, ...filters }, { take: 1 })
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Settlement ${id} was not found`)
  }

  const [item] = await decorate(container, [row as unknown as SettlementDTO])
  const lines = await connector.listSettlementLines({ settlement_id: id }, { take: null, order: { created_at: "ASC" } })
  const idsOf = (type: SettlementLineType) => lines.filter((l) => l.type === type).map((l) => l.source_id)

  const payoutIds = idsOf(SettlementLineType.PAYOUT)
  const reversalIds = idsOf(SettlementLineType.REVERSAL)
  const adjustmentIds = [...idsOf(SettlementLineType.ADJUSTMENT_CREDIT), ...idsOf(SettlementLineType.ADJUSTMENT_DEBIT)]

  const reversals = reversalIds.length
    ? await payoutModule.listPayoutReversals({ id: reversalIds }, { take: null })
    : []
  const allPayoutIds = Array.from(new Set([...payoutIds, ...reversals.map((r) => r.payout_id)]))
  const payouts = allPayoutIds.length ? await payoutModule.listPayouts({ id: allPayoutIds }, { take: null }) : []
  const adjustments = adjustmentIds.length ? await connector.listAdjustments({ id: adjustmentIds }, { take: null }) : []

  const payoutById = new Map(payouts.map((p) => [p.id, p]))
  const orderIds = Array.from(new Set(payouts.map((p) => p.order_id).filter((v): v is string => !!v)))
  const displayIds = new Map<string, number>()
  if (orderIds.length) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id"],
      filters: { id: orderIds },
    })
    for (const order of orders) displayIds.set(order.id, order.display_id)
  }

  const lineBySource = new Map(lines.map((l) => [l.source_id, l]))
  const orderLine = (orderId: string | null) => ({
    order_id: orderId,
    order_display_id: orderId ? displayIds.get(orderId) ?? null : null,
  })

  const payoutLines: SettlementLine[] = payoutIds.map((sourceId) => {
    const payout = payoutById.get(sourceId)
    return {
      id: lineBySource.get(sourceId)?.id as string,
      type: SettlementLineType.PAYOUT,
      source_id: sourceId,
      ...orderLine(payout?.order_id ?? null),
      refund_id: null,
      amount: lineBySource.get(sourceId)?.amount ?? 0,
      status: payout?.status ?? null,
      provider_id: providerIdOf(payout?.data),
    }
  })

  const reversalLines: SettlementLine[] = reversals.map((reversal) => ({
    id: lineBySource.get(reversal.id)?.id as string,
    type: SettlementLineType.REVERSAL,
    source_id: reversal.id,
    ...orderLine(payoutById.get(reversal.payout_id)?.order_id ?? null),
    refund_id: reversal.refund_id,
    amount: lineBySource.get(reversal.id)?.amount ?? reversal.amount,
    status: reversal.status,
    provider_id: providerIdOf(reversal.data),
  }))

  return {
    ...item,
    payouts: payoutLines,
    reversals: reversalLines,
    adjustments: adjustments.map((a) => ({
      id: a.id,
      type: a.type,
      amount: a.amount,
      reason: a.reason,
      created_by: a.created_by,
      status: a.status,
      provider_transfer_id: a.provider_transfer_id,
    })),
  }
}
