import { BigNumberInput, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { providerIdOf } from "../../lib/provider-data"
import { SettlementDTO, SettlementLineType } from "../../types/common"
import { SettlementDetail, SettlementLine, SettlementListItem } from "../../types/http"

export const settlementListFields = [
  "*",
  "payout_account.id",
  "payout_account.seller.id",
  "payout_account.seller.name",
  "payout_account.seller.handle",
  "lines.id",
  "lines.type",
]

export const settlementDetailFields = [
  ...settlementListFields,
  "lines.amount",
  "lines.payout_id",
  "lines.payout_reversal_id",
  "lines.payout.status",
  "lines.payout.order_id",
  "lines.payout.data",
  "lines.payout.order.display_id",
  "lines.payout_reversal.status",
  "lines.payout_reversal.refund_id",
  "lines.payout_reversal.data",
  "lines.payout_reversal.payout.order_id",
  "lines.payout_reversal.payout.order.display_id",
  "lines.adjustment.*",
]

type OrderRef = { order_id: string | null; order?: { display_id: number } | null } | null

type SettlementRow = SettlementDTO & {
  payout_account?: { id: string; seller?: { id: string; name: string; handle: string } | null } | null
  lines?: {
    id: string
    type: SettlementLineType
    amount?: BigNumberInput
    payout_id?: string | null
    payout_reversal_id?: string | null
    payout?: (OrderRef & { status: string; data: Record<string, unknown> | null }) | null
    payout_reversal?: {
      status: string
      refund_id: string | null
      data: Record<string, unknown> | null
      payout?: OrderRef
    } | null
    adjustment?: {
      id: string
      type: string
      amount: BigNumberInput
      reason: string | null
      created_by: string | null
      status: string
      provider_transfer_id: string | null
    } | null
  }[]
}

const ADJUSTMENT_TYPES = [SettlementLineType.ADJUSTMENT_CREDIT, SettlementLineType.ADJUSTMENT_DEBIT]

export function toSettlementListItem(row: SettlementRow): SettlementListItem {
  const { payout_account, lines = [], ...settlement } = row
  return {
    ...settlement,
    seller: payout_account?.seller ?? null,
    payout_count: lines.filter((line) => line.type === SettlementLineType.PAYOUT).length,
    reversal_count: lines.filter((line) => line.type === SettlementLineType.REVERSAL).length,
    adjustment_count: lines.filter((line) => ADJUSTMENT_TYPES.includes(line.type)).length,
  }
}

const orderOf = (ref: OrderRef | undefined) => ({
  order_id: ref?.order_id ?? null,
  order_display_id: ref?.order?.display_id ?? null,
})

export function toSettlementDetail(row: SettlementRow): SettlementDetail {
  const lines = row.lines ?? []

  const payouts: SettlementLine[] = lines
    .filter((line) => line.type === SettlementLineType.PAYOUT)
    .map((line) => ({
      id: line.id,
      type: line.type,
      source_id: line.payout_id as string,
      ...orderOf(line.payout),
      refund_id: null,
      amount: line.amount ?? 0,
      status: line.payout?.status ?? null,
      provider_id: providerIdOf(line.payout?.data),
    }))

  const reversals: SettlementLine[] = lines
    .filter((line) => line.type === SettlementLineType.REVERSAL)
    .map((line) => ({
      id: line.id,
      type: line.type,
      source_id: line.payout_reversal_id as string,
      ...orderOf(line.payout_reversal?.payout),
      refund_id: line.payout_reversal?.refund_id ?? null,
      amount: line.amount ?? 0,
      status: line.payout_reversal?.status ?? null,
      provider_id: providerIdOf(line.payout_reversal?.data),
    }))

  const adjustments = lines
    .filter((line) => ADJUSTMENT_TYPES.includes(line.type) && !!line.adjustment)
    .map((line) => {
      const adjustment = line.adjustment as NonNullable<typeof line.adjustment>
      return {
        id: adjustment.id,
        type: adjustment.type,
        amount: adjustment.amount,
        reason: adjustment.reason,
        created_by: adjustment.created_by,
        status: adjustment.status,
        provider_transfer_id: adjustment.provider_transfer_id,
      }
    })

  return { ...toSettlementListItem(row), payouts, reversals, adjustments }
}

export async function listSettlementRows(
  container: MedusaContainer,
  filters: Record<string, unknown>,
  pagination: { skip?: number; take?: number; order?: Record<string, string> }
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data, metadata } = await query.graph({
    entity: "settlement",
    fields: settlementListFields,
    filters,
    pagination: { ...pagination, order: pagination.order ?? { period_end: "DESC" } } as {
      skip?: number
      take?: number
      order: Record<string, "ASC" | "DESC">
    },
  })
  return {
    settlements: (data as unknown as SettlementRow[]).map(toSettlementListItem),
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  }
}

export async function retrieveSettlementDetail(
  container: MedusaContainer,
  id: string,
  filters: Record<string, unknown> = {}
): Promise<SettlementDetail> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [row],
  } = await query.graph({
    entity: "settlement",
    fields: settlementDetailFields,
    filters: { ...filters, id },
  })
  if (!row) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Settlement ${id} was not found`)
  }
  return toSettlementDetail(row as unknown as SettlementRow)
}

/** The payout accounts of a seller, for scoping vendor reads and admin writes. */
export async function sellerAccountIds(container: MedusaContainer, sellerId: string): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "seller_payout_account",
    fields: ["payout_account_id"],
    filters: { seller_id: sellerId },
  })
  return data.map((link) => link.payout_account_id)
}
