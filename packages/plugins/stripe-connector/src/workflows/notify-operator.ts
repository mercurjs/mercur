import { INotificationModuleService, Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  StepResponse,
  WorkflowResponse,
  createStep,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import StripeConnectorModuleService from "../modules/stripe-connector/service"
import { resolveConnector } from "../utils/payout-module"

export type NotifyOperatorWorkflowInput = {
  type: string
  payload: Record<string, unknown>
}

const RETRY_DELAYS_MS = [1000, 5000, 25000]
const ENDPOINT_DOWN_CHECKPOINT = "notification_endpoint_down_mailed_at"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const postOperatorNotificationStep = createStep(
  "post-operator-notification",
  async (input: NotifyOperatorWorkflowInput, { container }) => {
    const service = resolveConnector(container)
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const options = service.getOptions()
    const url = options.notifications.url

    if (!url) {
      return new StepResponse(null)
    }

    const body = { type: input.type, payload: input.payload }
    const record = await service.createConnectorNotifications({
      type: input.type,
      url,
      payload: body,
    })

    let attempts = 0
    let responseStatus: number | null = null
    let error: string | null = null
    let delivered = false

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      attempts += 1
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        })
        responseStatus = response.status
        if (response.ok) {
          delivered = true
          error = null
          break
        }
        error = `Operator endpoint answered ${response.status}`
      } catch (err) {
        error = err instanceof Error ? err.message : String(err)
      }

      if (attempt < RETRY_DELAYS_MS.length) {
        await sleep(RETRY_DELAYS_MS[attempt])
      }
    }

    const updated = await service.updateConnectorNotifications({
      id: record.id,
      attempts,
      response_status: responseStatus,
      error,
      delivered,
    })

    if (!delivered) {
      logger.error(`Error while notifying the operator at ${url}: ${error}`)
      await mailEndpointDown(
        service,
        container.resolve<INotificationModuleService>(Modules.NOTIFICATION),
        url,
        error ?? "unknown"
      )
    } else {
      logger.info(`Notification ${input.type} sent to operator (${responseStatus})`)
    }

    return new StepResponse(updated)
  }
)

async function mailEndpointDown(
  service: StripeConnectorModuleService,
  notificationService: INotificationModuleService,
  url: string,
  error: string
) {
  const options = service.getOptions()
  const email = options.alerting.technicalEmail
  if (!options.notifications.mailOnEndpointDown || !email) {
    return
  }

  const cooldownMs = options.notifications.endpointDownCooldownMinutes * 60 * 1000
  const last = await service.getCheckpoint(ENDPOINT_DOWN_CHECKPOINT)
  if (cooldownMs > 0 && last && Date.now() - new Date(last).getTime() < cooldownMs) {
    return
  }

  await notificationService.createNotifications({
    to: email,
    from: options.alerting.from,
    channel: "email",
    template: "payout-notification-endpoint-down",
    data: { url, error },
    content: {
      subject: "[Payouts] Operator notification endpoint is down",
      text: `POST ${url} failed after retries: ${error}`,
    },
  })

  await service.setCheckpoint(ENDPOINT_DOWN_CHECKPOINT, new Date().toISOString())
}

export const notifyOperatorWorkflowId = "notify-operator"

export const notifyOperatorWorkflow = createWorkflow(
  notifyOperatorWorkflowId,
  function (input: NotifyOperatorWorkflowInput) {
    const result = postOperatorNotificationStep(input)
    return new WorkflowResponse(result)
  }
)
