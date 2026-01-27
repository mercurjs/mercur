import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { CreateOrderSetDTO } from "@mercurjs/framework";
import { MARKETPLACE_MODULE, MarketplaceModuleService } from "../../../modules/marketplace";

export const createOrderSetStep = createStep(
  "create-order-set",
  async (input: CreateOrderSetDTO, { container }) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE);

    const orderSet = await service.createOrderSets(input);

    return new StepResponse(orderSet, orderSet.id);
  },
  async (orderSetId: string, { container }) => {
    const service =
      container.resolve<MarketplaceModuleService>(MARKETPLACE_MODULE);
    await service.deleteOrderSets(orderSetId);
  }
);
