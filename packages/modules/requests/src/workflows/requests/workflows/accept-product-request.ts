import { WorkflowResponse, createWorkflow } from "@medusajs/workflows-sdk";

import { AcceptRequestDTO, updateProductStatusStep } from "@mercurjs/framework";

import { updateRequestWorkflow } from "./update-request";
import { ProductStatus } from "@medusajs/framework/utils";

export const acceptProductRequestWorkflow = createWorkflow(
  "accept-product-request",
  function (input: AcceptRequestDTO) {
    const product = updateProductStatusStep({
      id: input.data.product_id,
      status: ProductStatus.PUBLISHED,
    });

    updateRequestWorkflow.runAsStep({ input });
    return new WorkflowResponse(product);
  }
);
