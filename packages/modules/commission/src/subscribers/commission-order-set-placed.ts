import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { OrderSetWorkflowEvents, SELLER_ORDER_LINK } from "@mercurjs/framework";
import { calculateCommissionWorkflow } from "../workflows/commission/workflows";

export default async function commissionOrderSetPlacedHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [set],
  } = await query.graph({
    entity: "order_set",
    fields: ["orders.id"],
    filters: {
      id: event.data.id,
    },
  });

  const ordersCreated = set.orders.map((o) => o.id);

  for (const order_id of ordersCreated) {
    const {
      data: [seller],
    } = await query.graph({
      entity: SELLER_ORDER_LINK,
      fields: ["seller_id"],
      filters: {
        order_id,
      },
    });

    if (!seller) {
      return;
    }

    await calculateCommissionWorkflow.run({
      input: {
        order_id,
        seller_id: seller.seller_id,
      },
      container,
    });
  }
}

export const config: SubscriberConfig = {
  event: OrderSetWorkflowEvents.PLACED,
  context: {
    subscriberId: "commission-order-set-placed-handler",
  },
};
