import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ProviderWebhookPayload } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PayoutModuleEvents } from "@mercurjs/types"
import Stripe from "stripe"

import { resolveConnector } from "../utils/payout-module"
import { reviveRawData } from "../utils/webhook-raw-data"
import { processStripeBankPayoutWebhookWorkflow } from "../workflows/webhooks/workflows/process-stripe-bank-payout-webhook"

export default async function stripeConnectorWebhookHandler({
  event,
  container,
}: SubscriberArgs<ProviderWebhookPayload["payload"]>) {
  const rawData = reviveRawData(event.data?.rawData)
  const signature = (event.data?.headers as Record<string, unknown> | undefined)?.["stripe-signature"]
  if (!rawData || typeof signature !== "string") {
    return
  }

  let stripeEvent: Stripe.Event | null
  try {
    stripeEvent = resolveConnector(container).constructWebhookEvent(rawData, signature)
  } catch (error) {
    container
      .resolve(ContainerRegistrationKeys.LOGGER)
      .warn(`Stripe connector could not verify a webhook: ${(error as Error).message}`)
    return
  }
  if (!stripeEvent) {
    return
  }

  const payout = stripeEvent.type.startsWith("payout.") ? (stripeEvent.data.object as Stripe.Payout) : null

  await processStripeBankPayoutWebhookWorkflow(container).run({
    input: {
      type: stripeEvent.type,
      received_at: new Date().toISOString(),
      payout: payout
        ? {
            id: payout.id,
            status: payout.status,
            failure_code: payout.failure_code,
            failure_message: payout.failure_message,
          }
        : null,
    },
  })
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.WEBHOOK_RECEIVED,
  context: { subscriberId: "stripe-connector-webhook-handler" },
}
