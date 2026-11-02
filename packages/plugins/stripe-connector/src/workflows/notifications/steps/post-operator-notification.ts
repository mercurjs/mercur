import { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { ConnectorNotificationDTO } from "../../../types/common"
import { resolveConnector } from "../../../utils/payout-module"
import { notificationHeaders, redactUrl } from "../utils/notification-signature"

export type PostOperatorNotificationStepInput = {
  type: string
  payload: Record<string, unknown>
}

export type PostOperatorNotificationStepOutput = {
  notification: ConnectorNotificationDTO | null
  delivered: boolean
  error: string | null
}

const RETRY_DELAYS_MS = [1000, 5000, 25000]

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const postOperatorNotificationStepId = "post-stripe-operator-notification"

/**
 * POSTs the notification to the operator's endpoint, retrying with backoff,
 * and logs each delivery. Nothing is undone: the endpoint already got it.
 */
export const postOperatorNotificationStep = createStep(
  postOperatorNotificationStepId,
  async (input: PostOperatorNotificationStepInput, { container }) => {
    const connector = resolveConnector(container)
    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const { url, secret } = connector.getOptions().notifications

    if (!url) {
      return new StepResponse<PostOperatorNotificationStepOutput>({ notification: null, delivered: false, error: null })
    }

    const body = JSON.stringify({ type: input.type, payload: input.payload })
    const record = await connector.createConnectorNotifications({
      type: input.type,
      url: redactUrl(url) ?? "",
      payload: { type: input.type, payload: input.payload },
    })

    let attempts = 0
    let responseStatus: number | null = null
    let error: string | null = null
    let delivered = false

    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      attempts += 1
      try {
        const response = await fetch(url, { method: "POST", headers: notificationHeaders(body, secret), body })
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

    const notification = await connector.updateConnectorNotifications({
      id: record.id,
      attempts,
      response_status: responseStatus,
      error,
      delivered,
    })

    if (delivered) {
      logger.info(`Notification ${input.type} sent to operator (${responseStatus})`)
    } else {
      logger.error(`Error while notifying the operator at ${redactUrl(url)}: ${error}`)
    }

    return new StepResponse<PostOperatorNotificationStepOutput>({ notification, delivered, error })
  }
)
