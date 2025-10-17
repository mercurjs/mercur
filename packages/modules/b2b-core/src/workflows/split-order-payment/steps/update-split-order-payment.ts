import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  SplitOrderPaymentDTO,
  UpdateSplitOrderPaymentsDTO,
} from "@mercurjs/framework";
import {
  SPLIT_ORDER_PAYMENT_MODULE,
  SplitOrderPaymentModuleService,
} from "../../../modules/split-order-payment";

export const updateSplitOrderPaymentsStep = createStep(
  "update-split-order-payments",
  async (input: UpdateSplitOrderPaymentsDTO[], { container }) => {
    const service = container.resolve<SplitOrderPaymentModuleService>(
      SPLIT_ORDER_PAYMENT_MODULE
    );

    const previousData = await service.listSplitOrderPayments({
      id: input.map((i) => i.id),
    });

    const updatedData = await service.updateSplitOrderPayments(input);
    return new StepResponse(updatedData, previousData);
  },
  async (previousData: SplitOrderPaymentDTO[], { container }) => {
    const service = container.resolve<SplitOrderPaymentModuleService>(
      SPLIT_ORDER_PAYMENT_MODULE
    );
    await service.updateSplitOrderPayments(previousData);
  }
);
