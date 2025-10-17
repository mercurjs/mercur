import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { SellerDTO } from "@mercurjs/framework";
import { SELLER_MODULE, SellerModuleService } from "../../../modules/seller";

export const createSellerOnboardingStep = createStep(
  "create-seller-onboarding",
  async (input: SellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE);

    const onboarding = await service.createSellerOnboardings({
      seller_id: input.id,
    });

    return new StepResponse(onboarding, onboarding.id);
  }
);
