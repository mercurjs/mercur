import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk';

import { updateCommissionLinesForOrderStep } from '../steps/update-commission-lines-for-order';

type WorkflowInput = {
  order_id: string;
  seller_id: string;
  canceled_item_ids?: string[];
};

export const recalculateCommissionWorkflow = createWorkflow(
  'recalculate-commission-workflow',
  function (input: WorkflowInput) {
    return new WorkflowResponse(updateCommissionLinesForOrderStep(input));
  }
);
