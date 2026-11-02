import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { nextWebhookAttemptAt, signWebhookBody } from "../../../modules/magento-webhook/utils"
import {
  IMagentoWebhookModuleService,
  MAGENTO_WEBHOOK_MODULE,
  MagentoWebhookDeliveryDTO,
  UpdateMagentoWebhookDeliveryDTO,
} from "../../../types"

const REQUEST_TIMEOUT_MS = 10_000
const MAX_RESPONSE_BODY = 2_000

export type SendMagentoWebhookDeliveryStepInput = {
  delivery: MagentoWebhookDeliveryDTO
  skip: boolean
}

export const sendMagentoWebhookDeliveryStepId = "send-magento-webhook-delivery"
export const sendMagentoWebhookDeliveryStep = createStep(
  sendMagentoWebhookDeliveryStepId,
  async ({ delivery, skip }: SendMagentoWebhookDeliveryStepInput, { container }) => {
    const endpoint = delivery.endpoint
    if (skip || !endpoint) {
      return new StepResponse(delivery)
    }

    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)

    const body = JSON.stringify({
      id: delivery.id,
      event: delivery.event,
      created_at: delivery.created_at,
      data: delivery.payload,
    })

    let responseStatus: number | null = null
    let responseBody: string | null = null

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "user-agent": "mercur-magento2-connector",
          "x-mercur-event": delivery.event,
          "x-mercur-delivery": delivery.id,
          "x-mercur-signature": signWebhookBody(body, endpoint.secret),
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      responseStatus = response.status
      responseBody = (await response.text()).slice(0, MAX_RESPONSE_BODY)
    } catch (error) {
      responseBody = String(error instanceof Error ? error.message : error).slice(
        0,
        MAX_RESPONSE_BODY
      )
    }

    const attempts = delivery.attempts + 1
    const ok = responseStatus !== null && responseStatus >= 200 && responseStatus < 300
    const nextAttemptAt = ok ? null : nextWebhookAttemptAt(attempts)

    const previous: UpdateMagentoWebhookDeliveryDTO = {
      id: delivery.id,
      status: delivery.status,
      attempts: delivery.attempts,
      next_attempt_at: delivery.next_attempt_at,
      response_status: delivery.response_status,
      response_body: delivery.response_body,
      delivered_at: delivery.delivered_at,
    }

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

    return new StepResponse(updated, previous)
  },
  async (previous, { container }) => {
    if (!previous) {
      return
    }

    const service = container.resolve<IMagentoWebhookModuleService>(MAGENTO_WEBHOOK_MODULE)
    await service.updateMagentoWebhookDeliveries([previous])
  }
)
