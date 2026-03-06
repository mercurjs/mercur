import {
  ContainerRegistrationKeys,
  MedusaError,
  OrderStatus
} from '@medusajs/framework/utils';
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk';

export const validateCanDeleteReservationsStep = createStep(
  'validate-can-delete-reservations',
  async (ids: string[], { container }) => {
    if (!ids.length) {
      return new StepResponse(void 0);
    }

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

    return new StepResponse(void 0);
  }
);
