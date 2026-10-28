import { BigNumberInput } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { PayoutStatus } from "@mercurjs/types"

import { landedOf } from "../../../lib/landed"
import { AdjustmentType, SettlementLineType } from "../../../types/common"
import { resolveConnector, resolvePayoutModule } from "../../../utils/payout-module"
import { SettlementSource, UnsettledLine, unsettledSince } from "../utils/plan-settlements"

const SETTLED_CHECK_CHUNK = 1000

type ReversalRow = {
  id: string
  amount: BigNumberInput
  data: Record<string, unknown> | null
  updated_at: Date | string
  payout?: { currency_code: string } | null
}

export type LoadSettlementSourcesStepInput = {
  accounts: {
    id: string
    external_id: string | null
    payouts_enabled: boolean
    created_at: Date | string
    seller?: { id: string } | null
  }[]
}

const chunk = <T>(values: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, i) => values.slice(i * size, (i + 1) * size))

export const loadSettlementSourcesStepId = "load-stripe-settlement-sources"

/**
 * The previous settlements of each account and the paid payouts, reversals
 * and adjustments no settlement holds yet. Each account is read with its own
 * window, which a single graph query cannot express.
 */
export const loadSettlementSourcesStep = createStep(
  loadSettlementSourcesStepId,
  async (input: LoadSettlementSourcesStepInput, { container }) => {
    const connector = resolveConnector(container)
    const payoutModule = resolvePayoutModule(container)
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { enabled, mode } = connector.getOptions().settlements
    const sources: SettlementSource[] = []

    if (!enabled) {
      return new StepResponse({ sources, mode })
    }

    for (const account of input.accounts) {
      const previous = await connector.listSettlements(
        { account_id: account.id },
        {
          take: null,
          select: ["currency_code", "period_start", "period_end", "status", "payout_status", "provider_payout_id"],
        }
      )
      const since = unsettledSince(previous)
      const window = since ? { updated_at: { $gt: since.toISOString() } } : {}

      const [payouts, reversals, adjustments] = await Promise.all([
        payoutModule.listPayouts(
          { account_id: account.id, status: PayoutStatus.PAID, ...window },
          { take: null, select: ["id", "amount", "currency_code", "data", "updated_at"] }
        ),
        query
          .graph({
            entity: "payout_reversal",
            fields: ["id", "amount", "data", "updated_at", "payout.currency_code"],
            filters: { status: PayoutStatus.PAID, payout: { account_id: account.id }, ...window },
          })
          .then(({ data }) => data as unknown as ReversalRow[]),
        connector.listAdjustments({ account_id: account.id, status: PayoutStatus.PAID, ...window }, { take: null }),
      ])

      const candidates: UnsettledLine[] = [
        ...payouts.map((p) => ({
          id: p.id,
          type: SettlementLineType.PAYOUT,
          amount: p.amount,
          paid_at: p.updated_at,
          currency_code: p.currency_code,
          ...landedOf(p.data),
        })),
        ...reversals.flatMap((r) =>
          r.payout
            ? [
                {
                  id: r.id,
                  type: SettlementLineType.REVERSAL,
                  amount: r.amount,
                  paid_at: r.updated_at,
                  currency_code: r.payout.currency_code,
                  ...landedOf(r.data),
                },
              ]
            : []
        ),
        ...adjustments.map((a) => ({
          id: a.id,
          type:
            a.type === AdjustmentType.EXTRA_CREDIT
              ? SettlementLineType.ADJUSTMENT_CREDIT
              : SettlementLineType.ADJUSTMENT_DEBIT,
          amount: a.amount,
          paid_at: a.updated_at,
          currency_code: a.currency_code,
          ...landedOf(a.data),
        })),
      ]

      const settled = new Set<string>()
      for (const ids of chunk(candidates.map((line) => line.id), SETTLED_CHECK_CHUNK)) {
        const lines = await connector.listSettlementLines(
          { $or: [{ payout_id: ids }, { payout_reversal_id: ids }, { adjustment_id: ids }] },
          { take: null, select: ["payout_id", "payout_reversal_id", "adjustment_id"] }
        )
        for (const line of lines) {
          for (const id of [line.payout_id, line.payout_reversal_id, line.adjustment_id]) {
            if (id) settled.add(id)
          }
        }
      }

      sources.push({
        account: {
          id: account.id,
          external_id: account.external_id,
          payouts_enabled: account.payouts_enabled,
          created_at: account.created_at,
        },
        seller_id: account.seller?.id ?? null,
        previous,
        lines: candidates.filter((line) => !settled.has(line.id)),
      })
    }

    return new StepResponse({ sources, mode })
  }
)
