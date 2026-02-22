import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { PAYOUT_MODULE, PayoutModuleService } from "../../../modules/payout";

export const syncStripeAccountStep = createStep(
  "sync-stripe-account",
  async (account_id: string, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE);

    const account = await service.syncStripeAccount(account_id);
    return new StepResponse(account);
  }
);
