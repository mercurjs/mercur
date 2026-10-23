import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  AdjustmentType,
  MercurModules,
  PayoutModuleEvents,
  PayoutStatus,
  SettlementStatus,
  TransferStatus,
  TransferType,
} from "@mercurjs/types"
import { Modules } from "@medusajs/framework/utils"

import PayoutModuleService from "../../../modules/payout/services/payout-module-service"
import { buildSettlement } from "../utils/settlement-builder"
import { PayoutJobContext } from "../utils/run-payout-job"
import { processPayoutWorkflow } from "../workflows/process-payout"
import { dispatchPending } from "./evaluate-order-transfers"

const INVOICE_TYPES = [TransferType.ADJUSTMENT_CREDIT, TransferType.ADJUSTMENT_DEBIT]

async function sellerIdsByAccount(container: MedusaContainer, accountIds: string[]) {
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

/** Pending adjustments become debit or credit transfers before the settlement counts them. */
export async function dispatchAdjustments(container: MedusaContainer) {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const adjustments = await service.listAdjustments({ transfer_id: null }, { take: null, relations: ["account"] })
  const pending: string[] = []

  for (const adjustment of adjustments) {
    const type =
      adjustment.type === AdjustmentType.EXTRA_CREDIT
        ? TransferType.ADJUSTMENT_CREDIT
        : TransferType.ADJUSTMENT_DEBIT
    const account = adjustment.account
    const ready = account?.payouts_enabled && !account.ignored
    const transfer = await service.createTransfers({
      account_id: adjustment.account_id,
      provider_id: account?.provider_id ?? service.getDefaultProviderId(),
      type,
      adjustment_id: adjustment.id,
      amount: Number(adjustment.amount),
      currency_code: adjustment.currency_code,
      status: ready ? TransferStatus.PENDING : TransferStatus.ON_HOLD,
      status_reason: ready ? null : "Payout account is not ready",
      source_created_at: new Date(adjustment.created_at),
    })
    await service.updateAdjustments({ id: adjustment.id, transfer_id: transfer.id })
    if (transfer.status === TransferStatus.PENDING) pending.push(transfer.id)
  }

  const backlog = await service.listTransfers(
    { type: INVOICE_TYPES, status: [TransferStatus.FAILED, TransferStatus.ON_HOLD] },
    { take: null, relations: ["account"] }
  )
  for (const row of backlog) {
    if (row.account?.payouts_enabled && !row.account.ignored) {
      await service.updateTransfers({ id: row.id, status: TransferStatus.PENDING, status_reason: null })
      pending.push(row.id)
    }
  }

  return await dispatchPending(container, pending)
}

export async function retryFailedPayouts(container: MedusaContainer, accountIds?: string[]) {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const filters: Record<string, unknown> = { status: [PayoutStatus.FAILED, PayoutStatus.ON_HOLD] }
  if (accountIds?.length) filters.account_id = accountIds
  const backlog = await service.listPayouts(filters, { take: null, relations: ["account"] })
  let retried = 0

  for (const payout of backlog) {
    const account = payout.account
    if (!account?.payouts_enabled || account.ignored) {
      continue
    }
    await service.updatePayouts({ id: payout.id, status: PayoutStatus.PENDING, status_reason: null })
    await processPayoutWorkflow(container).run({ input: { payout_id: payout.id }, throwOnError: false })
    retried += 1
  }

  return retried
}

/**
 * SellerSettlementCommand::processNewInvoices for Mercur: one settlement per
 * account and currency over the window since the previous one, then a
 * payout for it.
 */
export async function buildSettlements(
  container: MedusaContainer,
  now: Date,
  accountIds?: string[]
) {
  const service = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)
  const eventBus = container.resolve(Modules.EVENT_BUS)
  const options = service.getOptions()

  const accounts = await service.listPayoutAccounts(
    accountIds?.length ? { id: accountIds } : {},
    { take: null }
  )
  const sellers = await sellerIdsByAccount(container, accounts.map((a) => a.id))
  const counts: Record<string, number> = { settlements: 0, payouts: 0, aborted: 0, on_hold: 0, blocked: 0 }

  for (const account of accounts) {
    const lines = await service.listTransfers(
      { account_id: account.id, status: TransferStatus.CREATED, settlement_id: null },
      { take: null }
    )
    const currencies = Array.from(new Set(lines.map((line) => line.currency_code)))

    for (const currency of currencies) {
      const [previous] = await service.listSettlements(
        { account_id: account.id, currency_code: currency },
        { take: 1, order: { period_end: "DESC" } }
      )

      if (previous && previous.status === SettlementStatus.FAILED) {
        counts.blocked += 1
        continue
      }
      if (previous && previous.status === SettlementStatus.OPEN) {
        const [openPayout] = await service.listPayouts({ settlement_id: previous.id })
        // A payout the provider already accepted no longer holds the chain; only
        // one that still has to be sent (or was refused) does.
        if (!openPayout || ![PayoutStatus.PAID, PayoutStatus.PROCESSING, PayoutStatus.ABORTED, PayoutStatus.CANCELED].includes(openPayout.status)) {
          counts.blocked += 1
          continue
        }
      }

      const periodStart = previous ? new Date(previous.period_end) : new Date(account.created_at)
      if (periodStart.getTime() >= now.getTime()) {
        continue
      }

      const totals = buildSettlement(
        lines
          .filter((line) => line.currency_code === currency)
          .map((line) => ({
            id: line.id,
            type: line.type,
            status: line.status,
            amount: line.amount,
            currency_code: line.currency_code,
            updated_at: line.updated_at,
          })),
        { period_start: periodStart, period_end: now },
        { payouts_enabled: account.payouts_enabled, ignored: account.ignored, seller_id: sellers.get(account.id) ?? account.id }
      )

      if (!totals.transfer_ids.length && previous) {
        continue
      }

      const settlement = await service.createSettlements({
        account_id: account.id,
        provider_id: account.provider_id,
        currency_code: currency,
        period_start: periodStart,
        period_end: now,
        transfers_total: Number(totals.transfers_total),
        reversals_total: Number(totals.reversals_total),
        adjustments_total: Number(totals.adjustments_total),
        amount: Number(totals.amount),
        status: totals.status,
      })
      counts.settlements += 1

      if (totals.transfer_ids.length) {
        await service.updateTransfers(
          totals.transfer_ids.map((id) => ({ id, settlement_id: settlement.id }))
        )
      }

      await eventBus.emit({
        name: PayoutModuleEvents.SETTLEMENT_CREATED,
        data: {
          id: settlement.id,
          account_id: account.id,
          seller_id: sellers.get(account.id) ?? null,
          currency_code: currency,
          amount: settlement.amount,
        },
      })

      if (totals.status === SettlementStatus.ABORTED || !totals.payout_status) {
        counts.aborted += 1
        continue
      }

      const payout = await service.createPayoutRecord({
        account_id: account.id,
        settlement_id: settlement.id,
        amount: Number(totals.amount),
        currency_code: currency,
        status: options.settlements.mode === "provider" ? PayoutStatus.PAID : totals.payout_status,
        status_reason: totals.payout_reason,
      })

      if (options.settlements.mode === "provider") {
        await service.updateSettlements({ id: settlement.id, status: SettlementStatus.PAID_OUT })
        counts.payouts += 1
        continue
      }

      if (totals.payout_status === PayoutStatus.ON_HOLD) {
        await service.updateSettlements({ id: settlement.id, status: SettlementStatus.FAILED })
        counts.on_hold += 1
        continue
      }

      await processPayoutWorkflow(container).run({ input: { payout_id: payout.id }, throwOnError: false })
      counts.payouts += 1
    }
  }

  return counts
}

export async function processSettlements(ctx: PayoutJobContext, sellerId?: string) {
  const { container, service, stats, now } = ctx
  const options = service.getOptions()

  if (!options.settlements.enabled) {
    stats.skipped = "settlements disabled"
    return
  }

  let accountIds: string[] | undefined
  if (sellerId) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "seller_payout_account",
      fields: ["payout_account_id"],
      filters: { seller_id: sellerId },
    })
    accountIds = data.map((link) => link.payout_account_id)
    if (!accountIds.length) {
      stats.skipped = "seller has no payout account"
      return
    }
  }

  stats.adjustments_dispatched = await dispatchAdjustments(container)
  stats.payouts_retried = await retryFailedPayouts(container, accountIds)

  const counts = await buildSettlements(container, new Date(Math.max(now.getTime(), Date.now())), accountIds)
  Object.assign(stats, counts)
}
