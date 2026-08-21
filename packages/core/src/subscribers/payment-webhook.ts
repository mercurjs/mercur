import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ProviderWebhookPayload } from "@medusajs/framework/types"
import { Modules, PaymentActions } from "@medusajs/framework/utils"

import { PaymentWebhookEvents } from "../workflows/events"
import { processPaymentWorkflowId } from "../workflows/payment"

type SerializedBuffer = {
  data: ArrayBuffer
  type: "Buffer"
}

const IGNORED_ACTIONS: string[] = [
  PaymentActions.NOT_SUPPORTED,
  PaymentActions.CANCELED,
  PaymentActions.FAILED,
  PaymentActions.REQUIRES_MORE,
  PaymentActions.PENDING_AUTHORIZATION,
  // Intermediate provider events (e.g. Stripe `payment_intent.created`) must
  // not trigger cart completion.
  PaymentActions.PENDING,
]

export default async function paymentWebhookHandler({
  event,
  container,
}: SubscriberArgs<ProviderWebhookPayload>) {
  const paymentService = container.resolve(Modules.PAYMENT)

  const input = event.data

  if ((input.payload?.rawData as unknown as SerializedBuffer)?.type === "Buffer") {
    input.payload.rawData = Buffer.from(
      (input.payload.rawData as unknown as SerializedBuffer).data
    )
  }

  const processedEvent = await paymentService.getWebhookActionAndData(input)

  // Without a session id the event cannot be tied to a payment session, and
  // the workflow's filters would resolve to an arbitrary unrelated cart.
  if (!processedEvent.data?.session_id) {
    return
  }

  if (IGNORED_ACTIONS.includes(processedEvent.action)) {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(processPaymentWorkflowId, { input: processedEvent })
}

export const config: SubscriberConfig = {
  event: PaymentWebhookEvents.WEBHOOK_RECEIVED,
  context: {
    subscriberId: "mercur-payment-webhook-handler",
  },
}
