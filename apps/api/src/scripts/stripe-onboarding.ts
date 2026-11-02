import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createOnboardingWorkflow, createPayoutAccountWorkflow } from "@mercurjs/core/workflows"
import { MercurModules } from "@mercurjs/types"

import { requireStripeTestKey } from "./utils/stripe-test-key"

/**
 * Prints a fresh Stripe onboarding link for a seller (creating the Express
 * account if the seller has none) and then follows the payout account while
 * you complete onboarding in the browser. Nothing else syncs the account, so
 * every change printed was applied by an account.updated webhook.
 *
 * Run with the API and scripts/stripe-listen.sh up:
 *   SELLER_NAME="Kickz Corner" bun --cwd apps/api run stripe:onboarding
 */
const SELLER_NAME = process.env.SELLER_NAME ?? "Kickz Corner"
const WATCH_MINUTES = Number(process.env.WATCH_MINUTES ?? 20)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type Requirements = { currently_due?: string[]; past_due?: string[]; pending_verification?: string[] } | null

export default async function stripeOnboarding({ container }: ExecArgs) {
  requireStripeTestKey()
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const payoutService = container.resolve(MercurModules.PAYOUT)

  const {
    data: [seller],
  } = await query.graph({
    entity: "seller",
    fields: ["id", "name", "email", "payout_account.id"],
    filters: { name: SELLER_NAME },
  })
  if (!seller) throw new Error(`Seller ${SELLER_NAME} not found`)

  let accountId = seller.payout_account?.id
  if (!accountId) {
    const { result } = await createPayoutAccountWorkflow(container).run({ input: { seller_id: seller.id } })
    accountId = result.id
    logger.info(`Created a Stripe account for ${seller.name}`)
  }

  const onboarding = await createOnboardingWorkflow(container).run({ input: { account_id: accountId } })
  const link = (onboarding.result.data ?? {}) as { url?: string; kind?: string; expires_at?: string | null }

  const account = await payoutService.retrievePayoutAccount(accountId)
  logger.info(`${seller.name} (${seller.email}) → ${account.external_id}, status ${account.status}`)
  logger.info(`${link.kind === "login" ? "Express dashboard" : "Onboarding"} link${link.expires_at ? ` (expires ${link.expires_at})` : ""}:`)
  console.log(`\n  ${link.url}\n`)
  logger.info(`Watching for ${WATCH_MINUTES} min; Ctrl+C to stop`)

  const snapshot = (a: typeof account) => {
    const requirements = (a.data as { requirements?: Requirements } | null)?.requirements ?? null
    return [
      `status=${a.status}`,
      `kyc=${a.kyc_status}`,
      `details_submitted=${a.details_submitted}`,
      `charges=${a.charges_enabled}`,
      `payouts=${a.payouts_enabled}`,
      `due=${requirements?.currently_due?.length ?? 0}`,
      `pending_verification=${requirements?.pending_verification?.length ?? 0}`,
      a.disabled_reason ? `disabled=${a.disabled_reason}` : null,
    ]
      .filter(Boolean)
      .join(" ")
  }

  let last = snapshot(account)
  let lastSyncedAt = account.last_synced_at ? new Date(account.last_synced_at).getTime() : 0
  logger.info(last)

  const deadline = Date.now() + WATCH_MINUTES * 60_000
  while (Date.now() < deadline) {
    await sleep(2000)
    const fresh = await payoutService.retrievePayoutAccount(accountId)
    const syncedAt = fresh.last_synced_at ? new Date(fresh.last_synced_at).getTime() : 0
    const current = snapshot(fresh)
    if (syncedAt !== lastSyncedAt || current !== last) {
      logger.info(`webhook sync: ${current}`)
      const due = (fresh.data as { requirements?: Requirements } | null)?.requirements?.currently_due ?? []
      if (due.length) logger.info(`  currently due: ${due.join(", ")}`)
      last = current
      lastSyncedAt = syncedAt
    }
  }
}
