import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { AdminPayoutStatusResponse } from "../../../../types/http"
import { resolveConnector } from "../../../../utils/payout-module"
import { redactUrl } from "../../../../workflows/notifications/utils/notification-signature"
import { LAST_WEBHOOK_CHECKPOINT } from "../../../../workflows/webhooks/utils"
import { countFailed, describeJobs } from "../jobs/helpers"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse<AdminPayoutStatusResponse>) => {
  const connector = resolveConnector(req.scope)
  const { apiKey: _apiKey, webhookSecret: _webhookSecret, notifications, ...options } = connector.getOptions()
  const { secret: _secret, url, ...notificationOptions } = notifications

  const [jobs, failed, lastWebhook] = await Promise.all([
    describeJobs(req.scope),
    countFailed(req.scope),
    connector.getCheckpoint(LAST_WEBHOOK_CHECKPOINT),
  ])
  const checkpointOf = (job: string) => jobs.find((row) => row.job === job)?.checkpoint ?? null

  res.json({
    configured: connector.isConfigured(),
    options: {
      ...options,
      notifications: { ...notificationOptions, url: redactUrl(url) },
    } as unknown as Record<string, unknown>,
    checkpoints: {
      onboarding: checkpointOf("payout-sync-onboarding"),
      transfers: checkpointOf("payout-process-transfers"),
    },
    failed,
    last_webhook_at: lastWebhook ? new Date(lastWebhook) : null,
    jobs,
  })
}
