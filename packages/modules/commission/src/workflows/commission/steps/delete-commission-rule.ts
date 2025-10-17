import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  CommissionModuleService,
  COMMISSION_MODULE,
} from "../../../modules/commission";

export const deleteCommissionRuleStep = createStep(
  "delete-commission-rule",
  async (id: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    await service.softDeleteCommissionRules(id);

    return new StepResponse(id);
  },
  async (id: string, { container }) => {
    const service =
      container.resolve<CommissionModuleService>(COMMISSION_MODULE);

    await service.restoreCommissionRules(id);
  }
);
