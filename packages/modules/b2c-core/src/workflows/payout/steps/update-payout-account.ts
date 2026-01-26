import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { PayoutAccountDTO, UpdatePayoutAccountDTO } from "@mercurjs/framework";
import { PAYOUT_MODULE, PayoutModuleService } from "../../../modules/payout";

export const updatePayoutAccountStep = createStep(
  "update-payout-account",
  async (input: UpdatePayoutAccountDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE);

    const previousData = await service.retrievePayoutAccount(input.id);

    const updatedAccount: PayoutAccountDTO =
      await service.updatePayoutAccounts(input);

    return new StepResponse(updatedAccount, previousData);
  },
  async (previousData: PayoutAccountDTO, { container }) => {
    const service = container.resolve<PayoutModuleService>(PAYOUT_MODULE);

    await service.updatePayoutAccounts(previousData);
  }
);
