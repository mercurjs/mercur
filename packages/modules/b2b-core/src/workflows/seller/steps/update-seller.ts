import { toHandle } from "@medusajs/framework/utils";
import { Modules } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { SellerDTO, SellerEvents, UpdateSellerDTO } from "@mercurjs/framework";
import { SELLER_MODULE, SellerModuleService } from "../../../modules/seller";

export const updateSellerStep = createStep(
  "update-seller",
  async (input: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE);
    const eventBus = container.resolve(Modules.EVENT_BUS);

    const [previousData] = await service.listSellers({
      id: input.id,
    });

    const newHandle = input.name ? toHandle(input.name) : undefined;

    const updatedSellers: SellerDTO = await service.updateSellers({
      ...input,
      ...(newHandle ? { handle: newHandle } : {}),
    });

    if (input.store_status) {
      await eventBus.emit({
        name: SellerEvents.STORE_STATUS_CHANGED,
        data: {
          id: input.id,
          store_status: input.store_status,
        },
      });
    }

    return new StepResponse(updatedSellers, previousData as UpdateSellerDTO);
  },
  async (previousData: UpdateSellerDTO, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE);

    await service.updateSellers(previousData);
  }
);
