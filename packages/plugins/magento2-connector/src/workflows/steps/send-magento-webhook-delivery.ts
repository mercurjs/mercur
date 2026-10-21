import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import MagentoWebhookModuleService from "../../modules/magento-webhook/service"
import { MAGENTO_WEBHOOK_MODULE, MagentoWebhookDeliveryDTO } from "../../types"

const REQUEST_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BODY = 2_000

export type SendMagentoWebhookDeliveryStepInput = {
  delivery_id: string
}

export const sendMagentoWebhookDeliveryStep = createStep(
  "send-magento-webhook-delivery",
  async (input: SendMagentoWebhookDeliveryStepInput, { container }) => {
    const service = container.resolve<MagentoWebhookModuleService>(
      MAGENTO_WEBHOOK_MODULE
    )

    const delivery = await service.retrieveMagentoWebhookDelivery(
      input.delivery_id,
      { relations: ["endpoint"] }
    )

    if (delivery.status === "delivered" || delivery.status === "dead") {
      return new StepResponse(delivery as unknown as MagentoWebhookDeliveryDTO)
    }

    const body = JSON.stringify({
      id: delivery.id,
      event: delivery.event,
      created_at: delivery.created_at,
      data: delivery.payload,
    })

    let responseStatus: number | null = null
    let responseBody: string | null = null

    try {
      const response = await fetch(delivery.endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "mercur-magento2-connector",
          "x-mercur-event": delivery.event,
          "x-mercur-delivery": delivery.id,
          "x-mercur-signature": service.sign(body, delivery.endpoint.secret),
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      responseStatus = response.status
      responseBody = (await response.text()).slice(0, MAX_RESPONSE_BODY)
    } catch (error) {
      responseBody = String(
        error instanceof Error ? error.message : error
      ).slice(0, MAX_RESPONSE_BODY)
    }

    const attempts = delivery.attempts + 1
    const ok = responseStatus !== null && responseStatus >= 200 && responseStatus < 300
    const nextAttemptAt = ok ? null : service.nextAttemptAt(attempts)

    const [updated] = await service.updateMagentoWebhookDeliveries([
      {
        id: delivery.id,
        attempts,
        response_status: responseStatus,
        response_body: responseBody,
        status: ok ? "delivered" : nextAttemptAt ? "failed" : "dead",
        next_attempt_at: nextAttemptAt,
        delivered_at: ok ? new Date() : null,
      },
    ])

    return new StepResponse(updated as unknown as MagentoWebhookDeliveryDTO)
  }
)
