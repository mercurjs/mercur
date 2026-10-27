import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { listPendingCaptures } from "../../../../pipeline/captures"
import { countFailed, describeJobs } from "../../../../pipeline/jobs"
import { ONBOARDING_CHECKPOINT } from "../../../../pipeline/onboarding"
import { TRANSFERS_CHECKPOINT } from "../../../../pipeline/transfers"
import { LAST_WEBHOOK_CHECKPOINT } from "../../../../subscribers/payout-webhook-received"
import { CAPTURE_ERROR_KEY } from "../../../../types/common"
import { AdminPayoutStatusResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutStatusResponse>) => {
  const connector = resolveConnector(req.scope)
  const { apiKey: _apiKey, webhookSecret: _webhookSecret, ...options } = connector.getOptions()

  const [jobs, captures, failed, onboarding, transfers, lastWebhook] = await Promise.all([
    describeJobs(req.scope),
    listPendingCaptures(req.scope, connector.getOptions()),
    countFailed(req.scope),
    connector.getCheckpoint(ONBOARDING_CHECKPOINT),
    connector.getCheckpoint(TRANSFERS_CHECKPOINT),
    connector.getCheckpoint(LAST_WEBHOOK_CHECKPOINT),
  ])

  res.json({
    configured: connector.isConfigured(),
    options: options as unknown as Record<string, unknown>,
    checkpoints: { onboarding, transfers },
    failed: {
      captures: captures.filter((item) => !!item.collection.metadata?.[CAPTURE_ERROR_KEY]).length,
      ...failed,
    },
    last_webhook_at: lastWebhook ? new Date(lastWebhook) : null,
    jobs,
  })
}
