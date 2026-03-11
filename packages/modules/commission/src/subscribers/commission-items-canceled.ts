import { SubscriberArgs, SubscriberConfig } from '@medusajs/framework';
import { ContainerRegistrationKeys } from '@medusajs/framework/utils';

import { OrderWorkflowEvents, SELLER_ORDER_LINK } from '@mercurjs/framework';
import { recalculateCommissionWorkflow } from '../workflows/commission/workflows';

export default async function commissionItemsCanceledHandler({
  event,
  container
}: SubscriberArgs<{
  id: string;
  items: { id: string; quantity: number }[];
}>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [seller]
  } = await query.graph({
    entity: SELLER_ORDER_LINK,
    fields: ['seller_id'],
    filters: {
      order_id: event.data.id
    }
  });

  if (!seller) {
    return;
  }

  await recalculateCommissionWorkflow.run({
    input: {
      order_id: event.data.id,
      seller_id: seller.seller_id,
      canceled_item_ids: event.data.items.map((i) => i.id)
    },
    container
  });
}

export const config: SubscriberConfig = {
  event: OrderWorkflowEvents.ITEMS_CANCELED,
  context: {
    subscriberId: 'commission-items-canceled-handler'
  }
};
