import {
  WorkflowResponse,
  createHook,
  createWorkflow,
} from "@medusajs/workflows-sdk";

import { CreateCommissionRuleDTO } from "@mercurjs/framework";

import { checkForDuplicateStep, createCommissionRuleStep } from "../steps";

export const createCommissionRuleWorkflow = createWorkflow(
  "create-commission-rule",
  function (input: CreateCommissionRuleDTO) {
    checkForDuplicateStep(input);

    const rule = createCommissionRuleStep(input);

    const commissionRuleCreatedHook = createHook("commissionRuleCreated", {
      commission_rule_id: rule.id,
    });
    return new WorkflowResponse(rule, {
      hooks: [commissionRuleCreatedHook],
    });
  }
);
