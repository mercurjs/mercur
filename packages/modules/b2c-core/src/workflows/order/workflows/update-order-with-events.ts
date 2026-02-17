import { OrderWorkflow } from '@medusajs/framework/types';
import {
  createWorkflow,
  transform,
  WorkflowResponse
} from '@medusajs/framework/workflows-sdk';
import { updateOrderWorkflow } from '@medusajs/medusa/core-flows';
import { emitMultipleEventsStep, OrderUpdateEvents } from '@mercurjs/framework';

export const updateOrderWithEventsWorkflow = createWorkflow(
  { name: 'update-order-with-events' },
  (input: OrderWorkflow.UpdateOrderWorkflowInput) => {
    const result = updateOrderWorkflow.runAsStep({ input });

    const events = transform(input, (input) => {
      const { id, ...rest } = input;
      const eventsToEmit: any[] = [];

      if (rest.email) {
        eventsToEmit.push({
          name: OrderUpdateEvents.EMAIL_UPDATED,
          data: {
            order_id: id
          }
        });
      }

      if (rest.billing_address) {
        eventsToEmit.push({
          name: OrderUpdateEvents.BILLING_ADDRESS_UPDATED,
          data: {
            order_id: id
          }
        });
      }

      if (rest.shipping_address) {
        eventsToEmit.push({
          name: OrderUpdateEvents.SHIPPING_ADDRESS_UPDATED,
          data: {
            order_id: id
          }
        });
      }
      return eventsToEmit;
    });

    emitMultipleEventsStep(events);

    return new WorkflowResponse(result);
  }
);
