import { CreateNotificationDTO } from "@medusajs/framework/types"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"
import { redactUrl } from "../utils/notification-signature"

export const ENDPOINT_DOWN_CHECKPOINT = "notification_endpoint_down_mailed_at"

export const resolveEndpointDownMailStepId = "resolve-stripe-endpoint-down-mail"

/** The mail telling the operator their notification endpoint is down, unless it is off or cooling down. */
export const resolveEndpointDownMailStep = createStep(
  resolveEndpointDownMailStepId,
  async (input: { down: boolean; error: string | null }, { container }) => {
    const connector = resolveConnector(container)
    const { notifications, alerting } = connector.getOptions()
    const email = alerting.technicalEmail
    if (!input.down || !notifications.mailOnEndpointDown || !email) {
      return new StepResponse<CreateNotificationDTO[]>([])
    }

    const cooldownMs = notifications.endpointDownCooldownMinutes * 60 * 1000
    const last = await connector.getCheckpoint(ENDPOINT_DOWN_CHECKPOINT)
    if (cooldownMs > 0 && last && Date.now() - new Date(last).getTime() < cooldownMs) {
      return new StepResponse<CreateNotificationDTO[]>([])
    }

    const url = redactUrl(notifications.url)
    const error = input.error ?? "unknown"
    return new StepResponse<CreateNotificationDTO[]>([
      {
        to: email,
        from: alerting.from,
        channel: "email",
        template: "payout-notification-endpoint-down",
        data: { url, error },
        content: {
          subject: "[Payouts] Operator notification endpoint is down",
          text: `POST ${url} failed after retries: ${error}`,
        },
      },
    ])
  }
)
