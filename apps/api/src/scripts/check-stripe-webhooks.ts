import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MercurModules, PayoutStatus } from "@mercurjs/types"
import { getStripeClient } from "@mercurjs/stripe-connector-plugin/lib/stripe-client"
import { STRIPE_CONNECTOR_MODULE } from "@mercurjs/stripe-connector-plugin/types"

import { requireStripeTestKey } from "./utils/stripe-test-key"

/**
 * Proves the webhooks forwarded by scripts/stripe-listen.sh are verified and
 * processed, not just answered: the hook routes reply 200 before the
 * signature is checked, so each check triggers a real Stripe event and waits
 * for its effect in the database.
 *
 *   1. account.updated (Connect)   -> payout account re-synced
 *   2. transfer.created (platform) -> payout moved to paid
 *   3. payout.* (Connect)          -> settlement bank payout status
 *
 * Run with the API and the listener up, after simulate-stripe-payouts:
 *   bun --cwd apps/api run stripe:check-webhooks
 */
const SELLER_NAME = process.env.SELLER_NAME ?? "Sole Society"
const TIMEOUT_MS = Number(process.env.WEBHOOK_TIMEOUT_MS ?? 45000)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (check: () => Promise<boolean>, timeout = TIMEOUT_MS) => {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    if (await check()) return true
    await sleep(1500)
  }
  return false
}

export default async function checkStripeWebhooks({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const payoutService = container.resolve(MercurModules.PAYOUT)
  const connector = container.resolve(STRIPE_CONNECTOR_MODULE)

  const stripe = getStripeClient(requireStripeTestKey())

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "payout_account.id", "payout_account.external_id"],
    filters: { name: SELLER_NAME },
  })
  const account = seller?.payout_account
  if (!account?.external_id) throw new Error(`${SELLER_NAME} has no Stripe account`)

  const results: { check: string; ok: boolean | null; detail: string }[] = []

  // 1. account.updated
  const nonce = `check_${Date.now()}`
  await stripe.accounts.update(account.external_id, { metadata: { webhook_check: nonce } })
  const synced = await waitFor(async () => {
    const fresh = await payoutService.retrievePayoutAccount(account.id)
    const metadata = (fresh.data as { metadata?: Record<string, string> } | null)?.metadata
    return metadata?.webhook_check === nonce
  })
  results.push({
    check: "account.updated -> /hooks/payout",
    ok: synced,
    detail: synced ? `${account.external_id} re-synced` : "account not re-synced; check the API log for a signature error",
  })

  // 2. transfer.created: a 1-unit transfer tagged with a paid payout, which is
  // put back to processing so the webhook has something to move.
  const [paid] = await payoutService.listPayouts(
    { account_id: account.id, status: PayoutStatus.PAID },
    { order: { created_at: "DESC" }, take: 1 }
  )
  if (!paid) {
    results.push({ check: "transfer.created -> /hooks/payout", ok: null, detail: "no paid payout yet; run stripe:simulate first" })
  } else {
    // The sandbox platform balance is usually all pending, so the transfer is
    // funded by a charge of its own.
    const funding = await stripe.paymentIntents.create({
      amount: 100,
      currency: paid.currency_code,
      payment_method: "pm_card_bypassPending",
      payment_method_types: ["card"],
      confirm: true,
      metadata: { webhook_check: nonce },
    })
    // A transfer funded by a charge is in the currency the charge settled in.
    const settledIn = (await stripe.accounts.retrieve()).default_currency ?? paid.currency_code
    await payoutService.updatePayouts({ id: paid.id, status: PayoutStatus.PROCESSING })
    let transferId: string | null = null
    try {
      const transfer = await stripe.transfers.create({
        amount: 1,
        currency: settledIn,
        destination: account.external_id,
        source_transaction: funding.latest_charge as string,
        metadata: { payout_id: paid.id, webhook_check: nonce },
      })
      transferId = transfer.id
      const moved = await waitFor(async () => (await payoutService.retrievePayout(paid.id)).status === PayoutStatus.PAID)
      results.push({
        check: "transfer.created -> /hooks/payout",
        ok: moved,
        detail: moved ? `payout ${paid.id} paid via ${transfer.id}` : `payout ${paid.id} still processing`,
      })
    } finally {
      if (transferId) await stripe.transfers.createReversal(transferId).catch(() => null)
      const current = await payoutService.retrievePayout(paid.id)
      if (current.status !== PayoutStatus.PAID) {
        await payoutService.updatePayouts({ id: paid.id, status: PayoutStatus.PAID })
      }
    }
  }

  // 3. bank payout of the latest settlement
  const [settlement] = await connector.listSettlements(
    { account_id: account.id },
    { order: { period_end: "DESC" }, take: 1 }
  )
  if (!settlement?.provider_payout_id) {
    results.push({ check: "payout.* -> settlement", ok: null, detail: "no settlement paid out yet; run stripe:simulate first" })
  } else {
    const original = { status: settlement.status, payout_status: settlement.payout_status }
    await connector.updateSettlements({ id: settlement.id, payout_status: null })
    let applied = false
    try {
      // Touching the payout emits payout.updated, so the check does not depend
      // on Stripe moving the sandbox payout along in time.
      const bankPayout = await stripe.payouts.update(
        settlement.provider_payout_id,
        { metadata: { webhook_check: nonce } },
        { stripeAccount: account.external_id }
      )
      applied = await waitFor(async () => {
        const [fresh] = await connector.listSettlements({ id: settlement.id })
        return !!fresh?.payout_status
      })
      results.push({
        check: "payout.* -> settlement",
        ok: applied,
        detail: `settlement ${settlement.id}, bank payout ${bankPayout.id} is ${bankPayout.status}`,
      })
    } finally {
      if (!applied) {
        await connector.updateSettlements({ id: settlement.id, ...original })
      }
    }
  }

  for (const result of results) {
    const mark = result.ok === null ? "SKIP" : result.ok ? "PASS" : "FAIL"
    logger.info(`${mark}  ${result.check}  ${result.detail}`)
  }
  if (results.some((result) => result.ok === false)) {
    process.exitCode = 1
  }
}
