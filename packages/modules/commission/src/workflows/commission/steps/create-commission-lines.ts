import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  CommissionModuleService,
  COMMISSION_MODULE,
} from "../../../modules/commission";
import { CreateCommissionLineDTO } from "@mercurjs/framework";

export const createCommissionLinesStep = createStep(
  "create-commission-lines",
  async (input: CreateCommissionLineDTO[], { container }) => {
    const service = container.resolve(
      COMMISSION_MODULE
    ) as CommissionModuleService;

    // @ts-expect-error BigNumber incompatible interface
    const result = await service.createCommissionLines(input);

    return new StepResponse(result);
  }
);
