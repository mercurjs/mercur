import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import { CreateOrderReturnRequestDTO } from "@mercurjs/framework";

import returnRequestOrder from "../../../links/return-request-order";
import { 
  canPerformAction, 
  findLastDeliveryForItem
} from "@mercurjs/framework";

import type { Fulfillment } from "@mercurjs/framework";

function validateItemsEligibility(
  lineItems: Array<{ line_item_id: string; quantity: number }>,
  fulfillments: Fulfillment[]
): void {
  for (const requestedItem of lineItems) {
    const lastDelivery = findLastDeliveryForItem(
      requestedItem.line_item_id, 
      fulfillments
    );

    if (!lastDelivery?.delivered_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Item ${requestedItem.line_item_id} has not been delivered yet. Returns can only be requested for delivered items.`
      );
    }

    const eligibility = canPerformAction(lastDelivery.delivered_at);
    
    if (!eligibility.canPerform) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Return window has expired for item ${requestedItem.line_item_id}. Returns, exchanges, and complaints are only available within 30 days of delivery.`
      );
    }
  }
}

export const validateOrderReturnRequestStep = createStep(
  "validate-order-return-request",
  async (input: CreateOrderReturnRequestDTO, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [returnRequest],
    } = await query.graph({
      entity: returnRequestOrder.entryPoint,
      fields: ["return_request_id"],
      filters: {
        order_id: input.order_id,
      },
    });

    if (returnRequest) {
      throw new MedusaError(
        MedusaError.Types.INVALID_ARGUMENT,
        "Order return request already exists"
      );
    }

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.id",
        "fulfillments.id",
        "fulfillments.delivered_at",
        "fulfillments.items.id",
        "fulfillments.items.line_item_id"
      ],
      filters: {
        id: input.order_id,
      },
    });

    const orderLineItems = order.items.map((i) => i.id);

    for (const item of input.line_items) {
      if (!orderLineItems.includes(item.line_item_id)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_ARGUMENT,
          "Invalid line item"
        );
      }
    }

    validateItemsEligibility(input.line_items, order.fulfillments || []);

    const reason_ids = [
      ...new Set(input.line_items.map((item) => item.reason_id)),
    ];

    const { data: reasons } = await query.graph({
      entity: "return_reason",
      fields: ["id"],
      filters: {
        id: reason_ids,
      },
    });

    if (reasons.length !== reason_ids.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid reason");
    }

    return new StepResponse(true);
  }
);
