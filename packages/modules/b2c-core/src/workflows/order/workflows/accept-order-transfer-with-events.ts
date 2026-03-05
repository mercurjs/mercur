import { OrderWorkflow } from '@medusajs/framework/types';
import {
  createWorkflow,
  WorkflowData,
  WorkflowResponse
} from '@medusajs/framework/workflows-sdk';
import {
  acceptOrderTransferWorkflow,
  emitEventStep
} from '@medusajs/medusa/core-flows';
import { OrderUpdateEvents } from '@mercurjs/framework';

export const acceptOrderTransferWithEventsWorkflow = createWorkflow(
  { name: 'accept-order-transfer-with-events' },
  (input: WorkflowData<OrderWorkflow.AcceptOrderTransferWorkflowInput>) => {
    const result = acceptOrderTransferWorkflow.runAsStep({ input });

    emitEventStep({
      eventName: OrderUpdateEvents.ORDER_TRANSFERRED,
      data: {
        order_id: input.order_id
      }
    });

    return new WorkflowResponse(result);
  }
);
