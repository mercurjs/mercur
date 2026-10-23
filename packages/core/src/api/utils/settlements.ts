import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  HttpTypes,
  MercurModules,
  SettlementDTO,
  TransferType,
} from "@mercurjs/types"

import PayoutModuleService from "../../modules/payout/services/payout-module-service"

type ListOptions = {
  filters: Record<string, unknown>
  skip: number
  take: number
}

async function sellersByAccount(container: MedusaContainer, accountIds: string[]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const map = new Map<string, HttpTypes.SettlementSeller>()
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

async function decorate(
  container: MedusaContainer,
  settlements: SettlementDTO[]
): Promise<HttpTypes.SettlementListItem[]> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  if (!settlements.length) return []

  const ids = settlements.map((s) => s.id)
  const sellers = await sellersByAccount(container, Array.from(new Set(settlements.map((s) => s.account_id))))
  const transfers = await service.listTransfers({ settlement_id: ids }, { take: null, select: ["id", "type", "settlement_id"] })
  const payouts = await service.listPayouts({ settlement_id: ids }, { take: null })
  const adjustmentTransferIds = transfers
    .filter((t) => t.type === TransferType.ADJUSTMENT_CREDIT || t.type === TransferType.ADJUSTMENT_DEBIT)
    .map((t) => t.id)

  const payoutBySettlement = new Map(payouts.map((p) => [p.settlement_id, p]))

  return settlements.map((settlement) => {
    const own = transfers.filter((t) => t.settlement_id === settlement.id)
    const payout = payoutBySettlement.get(settlement.id)
    return {
      ...settlement,
      seller: sellers.get(settlement.account_id) ?? null,
      transfer_count: own.filter((t) => t.type === TransferType.ORDER || t.type === TransferType.TAX).length,
      reversal_count: own.filter((t) => t.type === TransferType.REFUND_REVERSAL).length,
      adjustment_count: own.filter((t) => adjustmentTransferIds.includes(t.id)).length,
      payout: payout
        ? {
            id: payout.id,
            display_id: payout.display_id,
            status: payout.status,
            status_reason: payout.status_reason,
            provider_payout_id: payout.provider_payout_id,
            created_at: payout.created_at,
          }
        : null,
    }
  })
}

export async function listSettlements(container: MedusaContainer, options: ListOptions) {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const [rows, count] = await service.listAndCountSettlements(options.filters, {
    skip: options.skip,
    take: options.take,
    order: { period_end: "DESC" },
  })
  const settlements = await decorate(container, rows)
  return { settlements, count }
}

export async function retrieveSettlement(
  container: MedusaContainer,
  id: string,
  filters: Record<string, unknown> = {}
): Promise<HttpTypes.SettlementDetail> {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const [row] = await service.listSettlements({ id, ...filters }, { take: 1 })
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Settlement ${id} was not found`)
  }

  const [item] = await decorate(container, [row])
  const transfers = await service.listTransfers({ settlement_id: id }, { take: null, order: { created_at: "ASC" } })
  const orderIds = Array.from(new Set(transfers.map((t) => t.order_id).filter(Boolean))) as string[]
  const displayIds = new Map<string, number>()
  if (orderIds.length) {
    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "display_id"],
      filters: { id: orderIds },
    })
    for (const order of orders) displayIds.set(order.id, order.display_id)
  }

  const adjustmentIds = transfers.map((t) => t.adjustment_id).filter(Boolean) as string[]
  const adjustments = adjustmentIds.length
    ? await service.listAdjustments({ id: adjustmentIds }, { take: null })
    : []
  const transferById = new Map(transfers.map((t) => [t.id, t]))

  const line = (t: (typeof transfers)[number]): HttpTypes.SettlementLine => ({
    id: t.id,
    type: t.type,
    order_id: t.order_id,
    order_display_id: t.order_id ? displayIds.get(t.order_id) ?? null : null,
    reverses_transfer_id: t.reverses_transfer_id,
    refund_id: t.refund_id,
    adjustment_id: t.adjustment_id,
    amount: t.amount,
    status: t.status,
    provider_transfer_id: t.provider_transfer_id,
    source_created_at: t.source_created_at,
  })

  return {
    ...item,
    transfers: transfers.filter((t) => t.type === TransferType.ORDER || t.type === TransferType.TAX).map(line),
    reversals: transfers.filter((t) => t.type === TransferType.REFUND_REVERSAL).map(line),
    adjustments: adjustments.map((a) => ({
      id: a.id,
      type: a.type,
      amount: a.amount,
      reason: a.reason,
      created_by: a.created_by,
      transfer_id: a.transfer_id,
      transfer_status: a.transfer_id ? transferById.get(a.transfer_id)?.status ?? null : null,
    })),
  }
}

export async function sellerAccountIds(container: MedusaContainer, sellerId: string): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller_payout_account",
    fields: ["payout_account_id"],
    filters: { seller_id: sellerId },
  })
  return data.map((link) => link.payout_account_id)
}
