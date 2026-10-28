import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { LAST_WEBHOOK_CHECKPOINT } from "../../../../subscribers/payout-webhook-received"
import { AdminPayoutStatusResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"
import { ONBOARDING_CHECKPOINT } from "../../../../workflows/onboarding/sync-onboarding"
import { PAYOUTS_CHECKPOINT } from "../../../../workflows/payouts/steps/select-payout-orders"
import { countFailed, describeJobs } from "../jobs/helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutStatusResponse>) => {
  const connector = resolveConnector(req.scope)
  const { apiKey: _apiKey, webhookSecret: _webhookSecret, ...options } = connector.getOptions()

  const [jobs, failed, onboarding, transfers, lastWebhook] = await Promise.all([
    describeJobs(req.scope),
    countFailed(req.scope),
    connector.getCheckpoint(ONBOARDING_CHECKPOINT),
    connector.getCheckpoint(PAYOUTS_CHECKPOINT),
    connector.getCheckpoint(LAST_WEBHOOK_CHECKPOINT),
  ])

  res.json({
    configured: connector.isConfigured(),
    options: options as unknown as Record<string, unknown>,
    checkpoints: { onboarding, transfers },
    failed,
    last_webhook_at: lastWebhook ? new Date(lastWebhook) : null,
    jobs,
  })
}
