import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  CommissionModuleService,
  COMMISSION_MODULE,
} from "../../../modules/commission";
import {
  CommissionRuleDTO,
  UpdateCommissionRuleDTO,
} from "@mercurjs/framework";

export const updateCommissionRuleStep = createStep(
  "update-commission-rule",
  async (input: UpdateCommissionRuleDTO, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    const previousData: CommissionRuleDTO =
      await service.retrieveCommissionRule(input.id);

    //@ts-expect-error - Incompatible type
    const updatedCommissionRule = await service.updateCommissionRules(input);

    return new StepResponse(updatedCommissionRule, previousData);
  },
  async (previousData: CommissionRuleDTO, { container }) => {
    const service = 
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    //@ts-expect-error Incompatible type
    await service.updateCommissionRules(previousData);
  }
);
