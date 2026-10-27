import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { PayoutAccountDTO, PayoutStatus } from "@mercurjs/types"

import { SettlementSourceLine, buildSettlement } from "../lib/settlement-builder"
import StripeConnectorModuleService from "../modules/stripe-connector/service"
import {
  AdjustmentType,
  SettlementLineType,
  SettlementStatus,
  StripeConnectorEvents,
} from "../types/common"
import { resolvePayoutModule } from "../utils/payout-module"
import { JobContext } from "../utils/run-job"

const RETRIABLE = [PayoutStatus.PENDING, PayoutStatus.FAILED, PayoutStatus.ON_HOLD]
const SETTLED_PAYOUT = [PayoutStatus.PAID, PayoutStatus.PROCESSING, PayoutStatus.ABORTED]

const isReady = (account: PayoutAccountDTO | undefined): account is PayoutAccountDTO =>
  !!account?.payouts_enabled && !!account.external_id

export async function sellerIdsByAccount(container: MedusaContainer, accountIds: string[]) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const map = new Map<string, string>()
  if (!accountIds.length) return map
  const { data } = await query.graph({
    entity: "seller_payout_account",
    fields: ["seller_id", "payout_account_id"],
    filters: { payout_account_id: accountIds },
  })
  for (const link of data) map.set(link.payout_account_id, link.seller_id)
  return map
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

async function accountsById(container: MedusaContainer, ids: string[]) {
  if (!ids.length) return new Map<string, PayoutAccountDTO>()
  const accounts = await resolvePayoutModule(container).listPayoutAccounts({ id: ids }, { take: null })
  return new Map(accounts.map((account) => [account.id, account]))
}

/** Sends pending adjustments, and retries failed or held ones whose account is ready. */
export async function dispatchAdjustments(container: MedusaContainer, connector: StripeConnectorModuleService) {
  const adjustments = await connector.listAdjustments({ status: RETRIABLE }, { take: null })
  const accounts = await accountsById(container, Array.from(new Set(adjustments.map((a) => a.account_id))))
  let dispatched = 0

  for (const adjustment of adjustments) {
    const account = accounts.get(adjustment.account_id)
    if (!isReady(account)) {
      if (adjustment.status !== PayoutStatus.ON_HOLD) {
        await connector.updateAdjustments({
          id: adjustment.id,
          status: PayoutStatus.ON_HOLD,
          status_reason: "Payout account is not ready",
        })
      }
      continue
    }
    await connector.dispatchAdjustment(adjustment.id, account.external_id as string)
    dispatched += 1
  }

  return dispatched
}

export async function retryFailedSettlementPayouts(
  container: MedusaContainer,
  connector: StripeConnectorModuleService,
  accountIds?: string[]
) {
  const filters: Record<string, unknown> = { payout_status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD] }
  if (accountIds?.length) filters.account_id = accountIds
  const backlog = await connector.listSettlements(filters, { take: null })
  const accounts = await accountsById(container, Array.from(new Set(backlog.map((s) => s.account_id))))
  let retried = 0

  for (const settlement of backlog) {
    const account = accounts.get(settlement.account_id)
    if (!isReady(account)) {
      continue
    }
    await connector.dispatchSettlementPayout(settlement.id, account.external_id as string)
    retried += 1
  }

  return retried
}

/** Paid payouts, reversals and adjustments of an account that no settlement holds yet. */
async function unsettledLines(
  container: MedusaContainer,
  connector: StripeConnectorModuleService,
  accountId: string
): Promise<(SettlementSourceLine & { currency_code: string })[]> {
  const payoutModule = resolvePayoutModule(container)

  const payouts = await payoutModule.listPayouts(
    { account_id: accountId },
    { take: null, select: ["id", "amount", "currency_code", "status", "updated_at"] }
  )
  const currencyByPayout = new Map(payouts.map((p) => [p.id, p.currency_code]))
  const reversals = payouts.length
    ? await payoutModule.listPayoutReversals(
        { payout_id: payouts.map((p) => p.id), status: PayoutStatus.PAID },
        { take: null, select: ["id", "payout_id", "amount", "updated_at"] }
      )
    : []
  const adjustments = await connector.listAdjustments(
    { account_id: accountId, status: PayoutStatus.PAID },
    { take: null }
  )

  const candidates = [
    ...payouts
      .filter((p) => p.status === PayoutStatus.PAID)
      .map((p) => ({
        id: p.id,
        type: SettlementLineType.PAYOUT,
        amount: p.amount,
        paid_at: p.updated_at,
        currency_code: p.currency_code,
      })),
    ...reversals.map((r) => ({
      id: r.id,
      type: SettlementLineType.REVERSAL,
      amount: r.amount,
      paid_at: r.updated_at,
      currency_code: currencyByPayout.get(r.payout_id) as string,
    })),
    ...adjustments.map((a) => ({
      id: a.id,
      type: a.type === AdjustmentType.EXTRA_CREDIT ? SettlementLineType.ADJUSTMENT_CREDIT : SettlementLineType.ADJUSTMENT_DEBIT,
      amount: a.amount,
      paid_at: a.updated_at,
      currency_code: a.currency_code,
    })),
  ]

  if (!candidates.length) {
    return []
  }

  const settled = new Set(
    (await connector.listSettlementLines({ source_id: candidates.map((c) => c.id) }, { take: null, select: ["source_id"] }))
      .map((line) => line.source_id)
  )
  return candidates.filter((c) => !settled.has(c.id))
}

/**
 * One settlement per account and currency over the window since the
 * previous one, then a bank payout for it.
 */
export async function buildSettlements(ctx: JobContext, now: Date, accountIds?: string[]) {
  const { container, connector, options } = ctx
  const eventBus = container.resolve(Modules.EVENT_BUS)

  const accounts = await resolvePayoutModule(container).listPayoutAccounts(
    accountIds?.length ? { id: accountIds } : {},
    { take: null }
  )
  const sellers = await sellerIdsByAccount(container, accounts.map((a) => a.id))
  const counts: Record<string, number> = { settlements: 0, payouts: 0, aborted: 0, on_hold: 0, blocked: 0 }

  for (const account of accounts) {
    const lines = await unsettledLines(container, connector, account.id)
    const currencies = Array.from(new Set(lines.map((line) => line.currency_code)))

    for (const currency of currencies) {
      const [previous] = await connector.listSettlements(
        { account_id: account.id, currency_code: currency },
        { take: 1, order: { period_end: "DESC" } }
      )

      if (previous?.status === SettlementStatus.FAILED) {
        counts.blocked += 1
        continue
      }
      // A bank payout the provider already accepted no longer holds the
      // chain; only one that still has to be sent does.
      if (
        previous?.status === SettlementStatus.OPEN &&
        !(previous.payout_status && SETTLED_PAYOUT.includes(previous.payout_status))
      ) {
        counts.blocked += 1
        continue
      }

      const periodStart = previous ? new Date(previous.period_end) : new Date(account.created_at)
      if (periodStart.getTime() >= now.getTime()) {
        continue
      }

      const sellerId = sellers.get(account.id) ?? account.id
      const totals = buildSettlement(
        lines.filter((line) => line.currency_code === currency),
        now,
        { payouts_enabled: account.payouts_enabled, seller_id: sellerId }
      )

      if (!totals.lines.length) {
        continue
      }

      const provider = options.settlements.mode === "provider"
      const payoutStatus = provider && totals.payout_status ? PayoutStatus.PAID : totals.payout_status
      const status =
        totals.status === SettlementStatus.ABORTED
          ? SettlementStatus.ABORTED
          : provider
            ? SettlementStatus.PAID_OUT
            : payoutStatus === PayoutStatus.ON_HOLD
              ? SettlementStatus.FAILED
              : SettlementStatus.OPEN

      const settlement = await connector.createSettlements({
        account_id: account.id,
        currency_code: currency,
        period_start: periodStart,
        period_end: now,
        payouts_total: Number(totals.payouts_total),
        reversals_total: Number(totals.reversals_total),
        adjustments_total: Number(totals.adjustments_total),
        amount: Number(totals.amount),
        status,
        payout_status: payoutStatus,
        status_reason: totals.payout_reason,
      })
      await connector.createSettlementLines(
        totals.lines.map((line) => ({
          settlement_id: settlement.id,
          type: line.type,
          source_id: line.id,
          amount: Number(line.amount),
        }))
      )
      counts.settlements += 1

      await eventBus.emit({
        name: StripeConnectorEvents.SETTLEMENT_CREATED,
        data: {
          id: settlement.id,
          account_id: account.id,
          seller_id: sellers.get(account.id) ?? null,
          currency_code: currency,
          amount: settlement.amount,
        },
      })

      if (status === SettlementStatus.ABORTED) {
        counts.aborted += 1
        continue
      }
      if (provider) {
        counts.payouts += 1
        continue
      }
      if (payoutStatus === PayoutStatus.ON_HOLD) {
        counts.on_hold += 1
        continue
      }

      await connector.dispatchSettlementPayout(settlement.id, account.external_id as string)
      counts.payouts += 1
    }
  }

  return counts
}

export async function processSettlements(ctx: JobContext, sellerId?: string) {
  const { container, connector, options, stats, now } = ctx

  if (!options.settlements.enabled) {
    stats.skipped = "settlements disabled"
    return
  }

  let accountIds: string[] | undefined
  if (sellerId) {
    accountIds = await sellerAccountIds(container, sellerId)
    if (!accountIds.length) {
      stats.skipped = "seller has no payout account"
      return
    }
  }

  stats.adjustments_dispatched = await dispatchAdjustments(container, connector)
  if (options.settlements.mode === "connector") {
    stats.payouts_retried = await retryFailedSettlementPayouts(container, connector, accountIds)
  }

  const counts = await buildSettlements(ctx, new Date(Math.max(now.getTime(), Date.now())), accountIds)
  Object.assign(stats, counts)
}
