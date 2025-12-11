import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";
import { Knex } from "@mikro-orm/postgresql";

import { OrderSetFilterHelper } from "../../../api/admin/order-sets/helpers";
import orderSetOrder from "../../../links/order-set-order";
import sellerOrder from "../../../links/seller-order";

export const filterOrderSetsByFulfillmentStatusStep = createStep(
  "filter-order-sets-by-fulfillment-status",
  async (input: { fulfillmentStatuses: string[] }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const knex = container.resolve(
      ContainerRegistrationKeys.PG_CONNECTION
    ) as Knex;

    const filterHelper = new OrderSetFilterHelper(
      knex,
      query,
      orderSetOrder.entryPoint,
      sellerOrder.entryPoint
    );

    const orderSetIds = await filterHelper.handleFulfillmentStatusFilter(
      input.fulfillmentStatuses
    );

    return new StepResponse({
      orderSetIds,
    });
  }
);
