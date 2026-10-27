import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ProviderWebhookPayload } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { MercurModules, PayoutModuleEvents } from "@mercurjs/types"

import PayoutModuleService from "../modules/payout/services/payout-module-service"
import { processPayoutForWebhookWorkflowId } from "../workflows/payout"

type SerializedBuffer = {
  data: ArrayBuffer
  type: "Buffer"
}

export default async function payoutWebhookHandler({
  event,
  container,
}: SubscriberArgs<ProviderWebhookPayload["payload"]>) {
  const payoutService = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

  const input = event.data

  if ((input?.rawData as unknown as SerializedBuffer)?.type === "Buffer") {
    input.rawData = Buffer.from((input.rawData as unknown as SerializedBuffer).data)
  }

  const processedEvent = await payoutService.getWebhookActionAndData({
    data: input.data as Record<string, unknown>,
    rawData: input.rawData,
    headers: input.headers as Record<string, unknown>,
  })

  if (!processedEvent.data || processedEvent.action === "not_supported") {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(processPayoutForWebhookWorkflowId, { input: processedEvent })
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.WEBHOOK_RECEIVED,
  context: {
    subscriberId: "payout-webhook-handler",
  },
}
