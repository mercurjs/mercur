import { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"
import { redactUrl } from "../utils/notification-signature"

export const ENDPOINT_DOWN_CHECKPOINT = "notification_endpoint_down_mailed_at"

export const mailNotificationEndpointDownStepId = "mail-stripe-notification-endpoint-down"

export const mailNotificationEndpointDownStep = createStep(
  mailNotificationEndpointDownStepId,
  async (input: { error: string | null }, { container }) => {
    const connector = resolveConnector(container)
    const { notifications, alerting } = connector.getOptions()
    const email = alerting.technicalEmail
    if (!notifications.mailOnEndpointDown || !email) {
      return new StepResponse(false)
    }

    const cooldownMs = notifications.endpointDownCooldownMinutes * 60 * 1000
    const last = await connector.getCheckpoint(ENDPOINT_DOWN_CHECKPOINT)
    if (cooldownMs > 0 && last && Date.now() - new Date(last).getTime() < cooldownMs) {
      return new StepResponse(false)
    }

    const url = redactUrl(notifications.url)
    const error = input.error ?? "unknown"
    await container.resolve<INotificationModuleService>(Modules.NOTIFICATION).createNotifications({
      to: email,
      from: alerting.from,
      channel: "email",
      template: "payout-notification-endpoint-down",
      data: { url, error },
      content: {
        subject: "[Payouts] Operator notification endpoint is down",
        text: `POST ${url} failed after retries: ${error}`,
      },
    })

    await connector.setCheckpoint(ENDPOINT_DOWN_CHECKPOINT, new Date().toISOString())
    return new StepResponse(true)
  }
)
