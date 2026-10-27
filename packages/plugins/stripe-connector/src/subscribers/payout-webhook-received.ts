import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ProviderWebhookPayload } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PayoutModuleEvents } from "@mercurjs/types"
import Stripe from "stripe"

import { resolveConnector } from "../utils/payout-module"

type SerializedBuffer = {
  data: ArrayBuffer
  type: "Buffer"
}

export const LAST_WEBHOOK_CHECKPOINT = "last_webhook_at"

const BANK_PAYOUT_EVENTS = ["payout.paid", "payout.failed", "payout.canceled", "payout.updated"]

/**
 * Core turns the same webhook into account and payout updates; this handler
 * records when it arrived and follows the bank payouts of settlements, which
 * core does not know about.
 */
export default async function stripeConnectorWebhookHandler({
  event,
  container,
}: SubscriberArgs<ProviderWebhookPayload["payload"]>) {
  const connector = resolveConnector(container)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  await connector.setCheckpoint(LAST_WEBHOOK_CHECKPOINT, new Date().toISOString())

  const input = event.data
  const rawData =
    (input?.rawData as unknown as SerializedBuffer)?.type === "Buffer"
      ? Buffer.from((input.rawData as unknown as SerializedBuffer).data)
      : (input?.rawData as string | Buffer)
  const signature = (input?.headers as Record<string, unknown> | undefined)?.["stripe-signature"]

  if (!rawData || typeof signature !== "string") {
    return
  }

  let stripeEvent: Stripe.Event | null
  try {
    stripeEvent = connector.constructWebhookEvent(rawData, signature)
  } catch (error) {
    logger.warn(`Stripe connector could not verify a webhook: ${(error as Error).message}`)
    return
  }

  if (!stripeEvent || !BANK_PAYOUT_EVENTS.includes(stripeEvent.type)) {
    return
  }

  const payout = stripeEvent.data.object as Stripe.Payout
  const reason = payout.failure_code
    ? `${payout.failure_code}: ${payout.failure_message ?? "Unknown failure reason"}`
    : null
  await connector.applySettlementPayoutEvent(payout.id, payout.status, reason)
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.WEBHOOK_RECEIVED,
  context: { subscriberId: "stripe-connector-webhook-handler" },
}
