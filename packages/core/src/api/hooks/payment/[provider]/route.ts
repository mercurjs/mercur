import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

import { PaymentWebhookEvents } from "../../../../workflows/events"

// Replaces Medusa's `/hooks/payment/:provider` route, which is disabled in
// `withMercur`. It is identical except for the event name: emitting Mercur's
// own event keeps Medusa's `payment-webhook` subscriber — and with it the
// stock cart completion — out of the marketplace checkout entirely.
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { provider } = req.params

    const options =
      (req.scope.resolve(Modules.PAYMENT) as unknown as { options?: Record<string, number> })
        .options || {}

    const eventBus = req.scope.resolve(Modules.EVENT_BUS)

    await eventBus.emit(
      {
        name: PaymentWebhookEvents.WEBHOOK_RECEIVED,
        data: {
          provider,
          payload: {
            data: req.body,
            rawData: req.rawBody,
            headers: req.headers,
          },
        },
      },
      {
        delay: options.webhook_delay || 5000,
        attempts: options.webhook_retries || 3,
      }
    )
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`)
    return
  }

  res.sendStatus(200)
}
