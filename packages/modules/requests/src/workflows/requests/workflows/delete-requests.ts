import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk';

import { deleteRequestsStep } from '../steps';

type DeleteRequestsWorkflowInput = {
  ids: string[];
};

export const deleteRequestsWorkflow = createWorkflow(
  'delete-requests',
  function (input: DeleteRequestsWorkflowInput) {
    const deletedIds = deleteRequestsStep(input);

    return new WorkflowResponse(deletedIds);
  }
);
