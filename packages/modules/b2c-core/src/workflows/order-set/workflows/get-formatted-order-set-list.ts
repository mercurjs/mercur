import { deduplicate } from '@medusajs/framework/utils';
import {
  WorkflowResponse,
  createWorkflow,
  transform
} from '@medusajs/framework/workflows-sdk';
import { useQueryGraphStep } from '@medusajs/medusa/core-flows';

import { formatOrderSets } from '../utils';
import { extractCanceledItemsFromOrderChangesStep } from '../steps/extract-canceled-items';

interface OrderSetData {
  orders?: Array<{ id: string }>;
}

export const getFormattedOrderSetListWorkflow = createWorkflow(
  'get-formatted-order-set-list',
  function (input: {
    fields?: string[];
    filters?: Record<string, unknown>;
    pagination?: {
      skip: number;
      take?: number;
      order?: Record<string, unknown>;
    };
  }) {
    const fields = transform(input, ({ fields }) => {
      return deduplicate([
        ...(fields ?? []),
        'id',
        'updated_at',
        'created_at',
        'display_id',
        'customer_id',
        'customer.*',
        'cart_id',
        'cart.*',
        'payment_collection_id',
        'payment_collection.*',
        'orders.id',
        'orders.currency_code',
        'orders.email',
        'orders.created_at',
        'orders.updated_at',
        'orders.completed_at',
        'orders.status',
        'orders.payment_status',
        'orders.fulfillment_status',
        'orders.total',
        'orders.subtotal',
        'orders.tax_total',
        'orders.discount_total',
        'orders.discount_tax_total',
        'orders.original_total',
        'orders.original_tax_total',
        'orders.item_total',
        'orders.item_subtotal',
        'orders.item_tax_total',
        'orders.sales_channel_id',
        'orders.original_item_total',
        'orders.original_item_subtotal',
        'orders.original_item_tax_total',
        'orders.shipping_total',
        'orders.shipping_subtotal',
        'orders.shipping_tax_total',
        'orders.items.*',
        'orders.items.detail.*',
        'orders.items.variant.*',
        'orders.items.variant.product.*',
        'orders.items.variant.options.*',
        'orders.items.variant.options.option.*',
        'orders.items.product.*',
        'orders.customer.*',
        'orders.fulfillments.*',
        'orders.shipping_methods.*',
        'orders.summary.*',
        'orders.items.product.attribute_values.value',
        'orders.items.product.attribute_values.attribute.name',
        'orders.items.variant.options.value',
        'orders.items.variant.options.option.title'
      ]);
    });

    const { data, metadata } = useQueryGraphStep({
      entity: 'order_set',
      fields,
      filters: input.filters,
      pagination: input.pagination
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

    return new WorkflowResponse({ data: formattedOrderSets, metadata });
  }
);
