import { MercurModules } from "@mercurjs/types"
import { Modules } from "@medusajs/framework/utils"

import PayoutService from "../modules/payout/services/payout-service"
import { ProviderWebhookPayload } from "@medusajs/framework/types"
import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { processPayoutWorkflowId } from "../workflows/payout"

type SerializedBuffer = {
  data: ArrayBuffer
  type: "Buffer"
}

export default async function payoutWebhookHandler({
  event,
  container,
}: SubscriberArgs<ProviderWebhookPayload['payload']>) {
  const payoutService = container.resolve<PayoutService>(MercurModules.PAYOUT)

  const input = event.data

  if (
    (input?.rawData as unknown as SerializedBuffer)?.type === "Buffer"
  ) {
    input.rawData = Buffer.from(
      (input.rawData as unknown as SerializedBuffer).data
    )
  }

  const processedEvent = await payoutService.getWebhookActionAndData(
    input
  )

  if (!processedEvent.data) {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(processPayoutWorkflowId, { input: processedEvent })
}

export const config: SubscriberConfig = {
  event: "payout.webhook_received",
  context: {
    subscriberId: "payout-webhook-handler",
  },
}
