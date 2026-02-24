import {
  createReservationsWorkflow,
  deleteReservationsWorkflow
} from '@medusajs/medusa/core-flows';
import {
  ContainerRegistrationKeys,
  MedusaError,
  OrderStatus
} from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

type ReservationSnapshot = {
  location_id: string;
  inventory_item_id: string;
  quantity: number;
  line_item_id?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
};

export const deleteReservationsWithCompensationStep = createStep(
  'delete-reservations-with-compensation',
  async (ids: string[], { container }) => {
    if (!ids.length) {
      return new StepResponse([], [] as ReservationSnapshot[]);
    }

    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

    const nonCanceledOrders = await knex('order')
      .select('order.id', 'order.status')
      .join('order_item', 'order.id', 'order_item.order_id')
      .join(
        'reservation_item',
        'order_item.item_id',
        'reservation_item.line_item_id'
      )
      .whereIn('reservation_item.id', ids)
      .whereNot('order.status', OrderStatus.CANCELED);

    if (nonCanceledOrders.length > 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        'Cancel order first to delete reservation.'
      );
    }

    const { data: reservations } = await query.graph({
      entity: 'reservation',
      fields: [
        'id',
        'location_id',
        'inventory_item_id',
        'quantity',
        'line_item_id',
        'description',
        'metadata'
      ],
      filters: { id: ids }
    });

    const snapshots: ReservationSnapshot[] = reservations.map((r) => ({
      location_id: r.location_id,
      inventory_item_id: r.inventory_item_id,
      quantity: r.quantity,
      line_item_id: r.line_item_id,
      description: r.description,
      metadata: r.metadata
    }));

    await deleteReservationsWorkflow(container).run({
      input: { ids }
    });

    return new StepResponse(ids, snapshots);
  },
  async (snapshots: ReservationSnapshot[], { container }) => {
    if (!snapshots?.length) {
      return;
    }

    await createReservationsWorkflow(container).run({
      input: { reservations: snapshots }
    });
  }
);
