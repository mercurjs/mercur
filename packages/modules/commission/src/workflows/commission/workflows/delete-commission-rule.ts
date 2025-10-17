import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/workflows-sdk";

import { deleteCommissionRuleStep } from "../steps";

export const deleteCommissionRuleWorkflow = createWorkflow(
  "delete-commission-rule",
  function (id: string) {
    deleteCommissionRuleStep(id);

    const commissionRuleDeletedHook = createHook("commissionRuleDeleted", {
      commission_rule_id: id,
    });
    return new WorkflowResponse(id, {
      hooks: [commissionRuleDeletedHook],
    });
  }
);
