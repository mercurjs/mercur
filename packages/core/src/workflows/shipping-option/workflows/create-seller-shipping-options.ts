import { createShippingOptionsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { FulfillmentWorkflow } from "@medusajs/framework/types"

import { linkSellerShippingOptionStep } from "../steps"

type CreateSellerShippingOptionsWorkflowInput = {
  shipping_options: FulfillmentWorkflow.CreateShippingOptionsWorkflowInput[]
  seller_id: string
}

export const createSellerShippingOptionsWorkflow = createWorkflow(
  "create-seller-shipping-options",
  function (input: CreateSellerShippingOptionsWorkflowInput) {
    const createdShippingOptions = createShippingOptionsWorkflow.runAsStep({
      input: input.shipping_options,
    })

    const shippingOptionIds = transform(
      createdShippingOptions,
      (shippingOptions) => shippingOptions.map((so) => so.id)
    )

    linkSellerShippingOptionStep({
      seller_id: input.seller_id,
      shipping_option_ids: shippingOptionIds,
    })

    return new WorkflowResponse(createdShippingOptions)
  }
)
