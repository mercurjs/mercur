import { deduplicate } from "@medusajs/framework/utils";
import {
  WorkflowResponse,
  createWorkflow,
  parallelize,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";
import { useQueryGraphStep } from "@medusajs/medusa/core-flows";

import {
  filterOrderSetsByFulfillmentStatusStep,
  filterOrderSetsByOrderIdStep,
  filterOrderSetsByPaymentStatusStep,
  filterOrderSetsBySearchStep,
  filterOrderSetsBySellerStep,
  intersectFilterResultsStep,
} from "../steps";
import { formatOrderSets } from "../utils";

export const filterAndListOrderSetsWorkflow = createWorkflow(
  "filter-and-list-order-sets",
  function (input: {
    filters: Record<string, any>;
    fields?: string[];
    pagination: {
      skip: number;
      take?: number;
      order?: Record<string, any>;
    };
  }) {
    const [
      orderIdFilterResult,
      searchFilterResult,
      sellerFilterResult,
      paymentStatusFilterResult,
      fulfillmentStatusFilterResult,
    ] = parallelize(
      when(
        { filters: input.filters },
        ({ filters }) => !!filters.order_id
      ).then(() => {
        return filterOrderSetsByOrderIdStep({
          orderId: input.filters.order_id,
        });
      }),
      when({ filters: input.filters }, ({ filters }) => !!filters.q).then(
        () => {
          return filterOrderSetsBySearchStep({
            searchQuery: input.filters.q,
          });
        }
      ),
      when(
        { filters: input.filters },
        ({ filters }) => !!filters.seller_id
      ).then(() => {
        const sellerIds = transform(
          { filters: input.filters },
          ({ filters }) => {
            return Array.isArray(filters.seller_id)
              ? filters.seller_id
              : [filters.seller_id];
          }
        );

        return filterOrderSetsBySellerStep({
          sellerIds,
        });
      }),
      when(
        { filters: input.filters },
        ({ filters }) => !!filters.payment_status
      ).then(() => {
        const paymentStatuses = transform(
          { filters: input.filters },
          ({ filters }) => {
            return Array.isArray(filters.payment_status)
              ? filters.payment_status
              : [filters.payment_status];
          }
        );

        return filterOrderSetsByPaymentStatusStep({
          paymentStatuses,
        });
      }),
      when(
        { filters: input.filters },
        ({ filters }) => !!filters.fulfillment_status
      ).then(() => {
        const fulfillmentStatuses = transform(
          { filters: input.filters },
          ({ filters }) => {
            return Array.isArray(filters.fulfillment_status)
              ? filters.fulfillment_status
              : [filters.fulfillment_status];
          }
        );

        return filterOrderSetsByFulfillmentStatusStep({
          fulfillmentStatuses,
        });
      })
    );

    const filterResults = transform(
      {
        orderIdFilterResult,
        searchFilterResult,
        sellerFilterResult,
        paymentStatusFilterResult,
        fulfillmentStatusFilterResult,
      },
      (data) => {
        return [
          data.orderIdFilterResult,
          data.searchFilterResult,
          data.sellerFilterResult,
          data.paymentStatusFilterResult,
          data.fulfillmentStatusFilterResult,
        ];
      }
    );

    const { finalOrderSetIds } = intersectFilterResultsStep({ filterResults });

    const isEmpty = transform({ finalOrderSetIds }, ({ finalOrderSetIds }) => {
      return Array.isArray(finalOrderSetIds) && finalOrderSetIds.length === 0;
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
          { filters: input.filters, finalOrderSetIds },
          ({ filters, finalOrderSetIds }) => {
            const newFilters = { ...filters };

            if (finalOrderSetIds !== null) {
              newFilters.id = finalOrderSetIds;
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

        const formattedOrderSets = transform(data, formatOrderSets);

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
