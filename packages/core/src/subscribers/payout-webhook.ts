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

type PayoutWebhookEvent = {
  provider?: string
  payload: ProviderWebhookPayload["payload"]
}

export default async function payoutWebhookHandler({
  event,
  container,
}: SubscriberArgs<PayoutWebhookEvent | ProviderWebhookPayload["payload"]>) {
  const payoutService = container.resolve<PayoutModuleService>(MercurModules.PAYOUT)

  // The legacy `/hooks/payout` route emitted the raw payload; the provider
  // route wraps it with the provider id.
  const wrapped = event.data as PayoutWebhookEvent
  const payload = (wrapped.payload ?? event.data) as ProviderWebhookPayload["payload"]
  const providerId = wrapped.provider ?? payoutService.getDefaultProviderId()

  if ((payload?.rawData as unknown as SerializedBuffer)?.type === "Buffer") {
    payload.rawData = Buffer.from((payload.rawData as unknown as SerializedBuffer).data)
  }

  const processedEvent = await payoutService.getWebhookActionAndData({
    provider_id: providerId,
    data: payload.data as Record<string, unknown>,
    rawData: payload.rawData,
    headers: payload.headers as Record<string, unknown>,
  })

  await payoutService.setCheckpoint("last_webhook_at", new Date().toISOString())

  if (!processedEvent.data || processedEvent.action === "not_supported") {
    return
  }

  const wfEngine = container.resolve(Modules.WORKFLOW_ENGINE)
  await wfEngine.run(processPayoutForWebhookWorkflowId, {
    input: { ...processedEvent, provider_id: providerId },
  })
}

export const config: SubscriberConfig = {
  event: PayoutModuleEvents.WEBHOOK_RECEIVED,
  context: {
    subscriberId: "payout-webhook-handler",
  },
}
