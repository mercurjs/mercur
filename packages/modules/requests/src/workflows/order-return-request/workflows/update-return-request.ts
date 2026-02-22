import {
  WorkflowResponse,
  createHook,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk";

import {
  AdminUpdateOrderReturnRequestDTO,
  VendorUpdateOrderReturnRequestDTO,
  SELLER_MODULE,
} from "@mercurjs/framework";

import { updateOrderReturnRequestStep } from "../steps";
import { proceedReturnRequestWorkflow } from "./proceed-return-request";
import {
  createRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows";
import returnRequestOrder from "../../../links/return-request-order";
import { Modules } from "@medusajs/framework/utils";

export const updateOrderReturnRequestWorkflow = createWorkflow(
  "update-order-return-request",
  function (
    input: VendorUpdateOrderReturnRequestDTO | AdminUpdateOrderReturnRequestDTO
  ) {
    when(input, (input) => input.status === "refunded").then(() => {
      proceedReturnRequestWorkflow.runAsStep({ input });
    });

    const request = updateOrderReturnRequestStep(input);

    const requestId = transform(request, (request) => request.id);
    const order = useQueryGraphStep({
      entity: returnRequestOrder.entryPoint,
      fields: ["order.returns.id", "order_return_request.seller.id"],
      filters: {
        order_return_request_id: requestId,
      },
    });

    const links = transform(order, (order) => {
      const returns = order.data[0].order.returns;
      const toLink = Array.isArray(returns) ? returns : [returns];
      const seller = order.data[0].order_return_request.seller.id;

      return toLink.map((r) => {
        return {
          [SELLER_MODULE]: {
            seller_id: seller,
          },
          [Modules.ORDER]: {
            return_id: r.id,
          },
        };
      });
    });

    createRemoteLinkStep(links);

    const orderReturnRequestUpdatedHook = createHook(
      "orderReturnRequestUpdated",
      {
        requestId,
      }
    );
    return new WorkflowResponse(request, {
      hooks: [orderReturnRequestUpdatedHook],
    });
  }
);
