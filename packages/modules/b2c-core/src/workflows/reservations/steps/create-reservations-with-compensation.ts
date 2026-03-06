import {
  createReservationsWorkflow,
  deleteReservationsWorkflow
} from '@medusajs/medusa/core-flows';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

type CreateReservationInput = {
  location_id: string;
  inventory_item_id: string;
  quantity: number;
  line_item_id?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
};

export const createReservationsWithCompensationStep = createStep(
  'create-reservations-with-compensation',
  async (reservations: CreateReservationInput[], { container }) => {
    if (!reservations.length) {
      return new StepResponse([] as string[], [] as string[]);
    }

    const { result } = await createReservationsWorkflow(container).run({
      input: { reservations }
    });

    const createdIds = result.map((r) => r.id);

    return new StepResponse(createdIds, createdIds);
  },
  async (createdIds: string[], { container }) => {
    if (!createdIds?.length) {
      return;
    }

    await deleteReservationsWorkflow(container).run({
      input: { ids: createdIds }
    });
  }
);
