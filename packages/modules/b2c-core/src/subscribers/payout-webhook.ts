import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";

import {
  PayoutWebhookActionPayload,
  PayoutWebhookEvents,
} from "@mercurjs/framework";
import { PAYOUT_MODULE } from "../modules/payout";
import { PayoutModuleService } from "../modules/payout";

import { processPayoutWebhookActionWorkflow } from "../workflows/payout/workflows";
import { PaymentProvider } from "../api/vendor/payout-account/types";

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

  // Determine payment provider from headers
  // Stripe uses 'stripe-signature', Adyen uses 'hmac' or other headers
  let payment_provider_id = PaymentProvider.STRIPE_CONNECT; // Default to Stripe for backwards compatibility

  if (input.headers?.["stripe-signature"]) {
    payment_provider_id = PaymentProvider.STRIPE_CONNECT;
  } else if (input.headers?.["hmac"] || input.headers?.["adyen-signature"]) {
    payment_provider_id = PaymentProvider.ADYEN_CONNECT;
  }

  const actionAndData = await payoutService.getWebhookActionAndData(
    payment_provider_id,
    input
  );

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
