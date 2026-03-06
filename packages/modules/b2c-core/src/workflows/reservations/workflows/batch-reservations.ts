import { updateReservationsWorkflow } from '@medusajs/medusa/core-flows';
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse
} from '@medusajs/framework/workflows-sdk';

import { deleteReservationsWithCompensationStep } from '../steps/delete-reservations-with-compensation';
import { createReservationsWithCompensationStep } from '../steps/create-reservations-with-compensation';

type BatchReservationsInput = {
  create?: Array<{
    location_id: string;
    inventory_item_id: string;
    quantity: number;
    line_item_id?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown>;
  }>;
  update?: Array<{
    id: string;
    location_id?: string;
    quantity?: number;
    description?: string | null;
    metadata?: Record<string, unknown>;
  }>;
  delete?: string[];
};

type BatchReservationsOutput = {
  deletedIds: string[];
  createdIds: string[];
  updatedIds: string[];
};

export const batchReservationsWorkflow = createWorkflow(
  'batch-reservations',
  (input: BatchReservationsInput) => {
    const deleteIds = transform(input, (data) => data.delete || []);
    const createItems = transform(input, (data) => data.create || []);
    const updateItems = transform(input, (data) => data.update || []);

    const deletedIds = deleteReservationsWithCompensationStep(deleteIds);
    const createdIds = createReservationsWithCompensationStep(createItems);

    when({ updateItems }, ({ updateItems }) => updateItems.length > 0).then(
      () => {
        updateReservationsWorkflow.runAsStep({
          input: { updates: updateItems }
        });
      }
    );

    const updatedIds = transform(updateItems, (items) =>
      items.map((i: { id: string }) => i.id)
    );

    const result = transform(
      { deletedIds, createdIds, updatedIds },
      (data): BatchReservationsOutput => ({
        deletedIds: data.deletedIds || [],
        createdIds: data.createdIds || [],
        updatedIds: data.updatedIds || []
      })
    );

    return new WorkflowResponse(result);
  }
);
