import { deduplicate } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

import {
  filterOrderSetsWithKnexStep,
  extractCanceledItemsFromOrderChangesStep,
} from "../steps";
import { formatOrderSets } from "../utils";

interface OrderSetData {
  orders?: Array<{ id: string }>;
}

export const filterAndListOrderSetsWorkflow = createWorkflow(
  "filter-and-list-order-sets",
  function (input: {
    filters: Record<string, unknown>;
    fields?: string[];
    pagination: {
      skip: number;
      take?: number;
      order?: Record<string, unknown>;
    };
  }) {
    const { orderSetIds, isEmpty } = filterOrderSetsWithKnexStep({
      filters: input.filters,
    });

    const emptyResponse = when({ isEmpty }, ({ isEmpty }) => isEmpty).then(
      () => {
        return transform(
          { pagination: input.pagination },
          ({ pagination }) => ({
            data: [],
            metadata: {
              count: 0,
              skip: pagination.skip,
              take: pagination.take ?? 50,
            },
          })
        );
      }
    );

    const dataResponse = when({ isEmpty }, ({ isEmpty }) => !isEmpty).then(
      () => {
        const finalFilters = transform(
          { filters: input.filters, orderSetIds },
          ({ filters, orderSetIds }) => {
            const newFilters = { ...filters };

            if (orderSetIds && orderSetIds.length > 0) {
              newFilters.id = orderSetIds;
            }

            delete newFilters.order_id;
            delete newFilters.q;
            delete newFilters.seller_id;
            delete newFilters.payment_status;
            delete newFilters.fulfillment_status;

            return newFilters;
          }
        );

        const fields = transform(input, ({ fields }) => {
          return deduplicate([
            ...(fields ?? []),
            "id",
            "updated_at",
            "created_at",
            "display_id",
            "customer_id",
            "customer.*",
            "cart_id",
            "cart.*",
            "payment_collection_id",
            "payment_collection.*",
            "orders.id",
            "orders.currency_code",
            "orders.email",
            "orders.created_at",
            "orders.updated_at",
            "orders.completed_at",
            "orders.status",
            "orders.payment_status",
            "orders.fulfillment_status",
            "orders.total",
            "orders.subtotal",
            "orders.tax_total",
            "orders.discount_total",
            "orders.discount_tax_total",
            "orders.original_total",
            "orders.original_tax_total",
            "orders.item_total",
            "orders.item_subtotal",
            "orders.item_tax_total",
            "orders.sales_channel_id",
            "orders.original_item_total",
            "orders.original_item_subtotal",
            "orders.original_item_tax_total",
            "orders.shipping_total",
            "orders.shipping_subtotal",
            "orders.shipping_tax_total",
            "orders.items.*",
            "orders.items.detail.*",
            "orders.items.variant.*",
            "orders.items.variant.product.*",
            "orders.items.variant.options.*",
            "orders.items.variant.options.option.*",
            "orders.items.product.*",
            "orders.customer.*",
            "orders.fulfillments.*",
            "orders.shipping_methods.*",
            "orders.summary.*",
          ]);
        });

        const { data, metadata } = useQueryGraphStep({
          entity: "order_set",
          fields,
          filters: finalFilters,
          pagination: input.pagination,
        });

        const orderIds = transform(data, (orderSets: OrderSetData[]) => 
          orderSets.flatMap((os) => os.orders?.map((o) => o.id) || [])
        );

        const canceledItemsMap = extractCanceledItemsFromOrderChangesStep({
          order_ids: orderIds
        });

        const formattedOrderSets = transform(
          { data, canceledItemsMap },
          ({ data, canceledItemsMap }) => formatOrderSets(data, canceledItemsMap)
        );

        return transform(
          { data: formattedOrderSets, metadata },
          ({ data, metadata }) => ({
            data,
            metadata,
          })
        );
      }
    );

    const result = transform(
      { emptyResponse, dataResponse },
      ({ emptyResponse, dataResponse }) => {
        return emptyResponse || dataResponse;
      }
    );

    return new WorkflowResponse(result);
  }
);
