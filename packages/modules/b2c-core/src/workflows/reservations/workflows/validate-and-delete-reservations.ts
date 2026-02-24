import {
  WorkflowResponse,
  createWorkflow
} from '@medusajs/framework/workflows-sdk';
import { deleteReservationsWorkflow } from '@medusajs/medusa/core-flows';

import { validateCanDeleteReservationsStep } from '../steps';

export const validateAndDeleteReservationsWorkflow = createWorkflow(
  'validate-and-delete-reservations',
  (input: { ids: string[] }) => {
    validateCanDeleteReservationsStep(input.ids);
    deleteReservationsWorkflow.runAsStep({
      input: { ids: input.ids }
    });

    return new WorkflowResponse(void 0);
  }
);
