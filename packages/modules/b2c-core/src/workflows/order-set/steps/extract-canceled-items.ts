import {
  ContainerRegistrationKeys,
  MathBN
} from '@medusajs/framework/utils';
import {
  StepResponse,
  createStep
} from '@medusajs/framework/workflows-sdk';
import { ProductOptionValueDTO } from '@medusajs/framework/types';

interface OrderChangeAction {
  action: string;
  details?: {
    quantity?: number;
    quantity_diff?: number;
    reference_id?: string;
  };
}

interface OrderChange {
  order_id: string;
  actions: OrderChangeAction[];
}

interface CanceledItemInfo {
  order_id: string;
  canceled_quantity: number;
  current_quantity: number;
}

interface OrderLineItem {
  id: string;
  title: string;
  thumbnail?: string | null;
  variant_id?: string;
  variant_title?: string;
  unit_price: number;
  quantity?: number;
  variant?: {
    title?: string;
    product?: {
      handle?: string;
    };
    options?: ProductOptionValueDTO[];
  };
  product?: {
    handle?: string;
  };
}

export const extractCanceledItemsFromOrderChangesStep = createStep(
  'extract-canceled-items-from-order-changes',
  async (
    {
      order_ids
    }: {
      order_ids: string[];
    },
    { container }
  ) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const { data: orderChanges } = await query.graph({
      entity: 'order_change',
      fields: [
        'id',
        'order_id',
        'status',
        'actions.*',
        'actions.details'
      ],
      filters: {
        order_id: order_ids,
        status: 'confirmed'
      }
    });

    const itemsWithCancelMap: Record<string, CanceledItemInfo> = {};

    for (const change of (orderChanges as OrderChange[]) || []) {
      const orderId = change.order_id;

      for (const action of change.actions || []) {
        if (action.action === 'ITEM_UPDATE') {
          const details = action.details || {};
          const itemId = details.reference_id;
          
          if (!itemId) continue;
          
          const newQty = Number(details.quantity || 0);
          const quantityDiff = Number(details.quantity_diff || 0);
          
          if (quantityDiff < 0) {
            const canceledQty = Math.abs(quantityDiff);
            
            if (!itemsWithCancelMap[itemId]) {
              itemsWithCancelMap[itemId] = {
                order_id: orderId,
                canceled_quantity: 0,
                current_quantity: newQty
              };
            }
            
            itemsWithCancelMap[itemId].canceled_quantity += canceledQty;
            itemsWithCancelMap[itemId].current_quantity = newQty;
          }
        }
      }
    }

    const itemIds = Object.keys(itemsWithCancelMap);
    
    const { data: fullItems } = await query.graph({
      entity: 'order_line_item',
      fields: [
        'id',
        'title',
        'thumbnail',
        'variant_id',
        'variant_title',
        'unit_price',
        'variant.*',
        'variant.product.*',
        'variant.options.*',
        'variant.options.option.*',
        'product.*'
      ],
      filters: {
        id: itemIds
      }
    });

    const canceledItemsMap: Record<
      string,
      Record<string, { 
        canceled_quantity: number; 
        current_quantity: number;
        item: OrderLineItem;
      }>
    > = {};

    for (const item of (fullItems as OrderLineItem[]) || []) {
      const itemId = item.id;
      const cancelInfo = itemsWithCancelMap[itemId];
      
      if (cancelInfo) {
        const orderId = cancelInfo.order_id;
        
        if (!canceledItemsMap[orderId]) {
          canceledItemsMap[orderId] = {};
        }
        
        canceledItemsMap[orderId][itemId] = {
          canceled_quantity: cancelInfo.canceled_quantity,
          current_quantity: cancelInfo.current_quantity,
          item: item
        };
      }
    }

    return new StepResponse(canceledItemsMap);
  }
);
