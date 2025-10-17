import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
  PayoutWebhookActionPayload,
  PayoutWebhookEvents,
} from "@mercurjs/framework";
import { PAYOUT_MODULE } from "../modules/payout";
import { PayoutModuleService } from "../modules/payout";

import { processPayoutWebhookActionWorkflow } from "../workflows/payout/workflows";

type SerializedBuffer = {
  data: ArrayBuffer;
  type: "Buffer";
};

export default async function payoutWebhookHandler({
  event,
  container,
}: SubscriberArgs<PayoutWebhookActionPayload>) {
  const payoutService: PayoutModuleService = container.resolve(PAYOUT_MODULE);

  const input = event.data;

  if ((input.rawData as unknown as SerializedBuffer)?.type === "Buffer") {
    input.rawData = Buffer.from(
      (input.rawData as unknown as SerializedBuffer).data
    );
  }

  const actionAndData = await payoutService.getWebhookActionAndData(input);

  if (!actionAndData) {
    return;
  }

  await processPayoutWebhookActionWorkflow(container).run({
    input: {
      action: actionAndData.action,
      data: actionAndData.data,
    },
  });
}

export const config: SubscriberConfig = {
  event: PayoutWebhookEvents.ACCOUNT_WEBHOOK_RECEIVED,
  context: {
    subscriberId: "payout-account-webhook-handler",
  },
};
