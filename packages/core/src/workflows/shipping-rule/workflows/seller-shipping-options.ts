import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { FulfillmentWorkflow } from "@medusajs/framework/types"
import {
  deleteShippingOptionsWorkflow,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"

import {
  validateMandatoryShippingOptionRemovalStep,
  validateSellerShippingOptionUpdateStep,
} from "../steps"

export type UpdateSellerShippingOptionWorkflowInput = {
  id: string
  update: Omit<FulfillmentWorkflow.UpdateShippingOptionsWorkflowInput, "id">
}

export const updateSellerShippingOptionWorkflowId =
  "update-seller-shipping-option"

export const updateSellerShippingOptionWorkflow = createWorkflow(
  updateSellerShippingOptionWorkflowId,
  (input: WorkflowData<UpdateSellerShippingOptionWorkflowInput>) => {
    validateSellerShippingOptionUpdateStep({
      shipping_option_id: input.id,
      update: input.update,
    })

    const updated = updateShippingOptionsWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => [
        {
          id: input.id,
          ...input.update,
        } as FulfillmentWorkflow.UpdateShippingOptionsWorkflowInput,
      ]),
    })

    return new WorkflowResponse(updated)
  }
)

export type DeleteSellerShippingOptionsWorkflowInput = {
  seller_id: string
  ids: string[]
}

export const deleteSellerShippingOptionsWorkflowId =
  "delete-seller-shipping-options"

export const deleteSellerShippingOptionsWorkflow = createWorkflow(
  deleteSellerShippingOptionsWorkflowId,
  (input: WorkflowData<DeleteSellerShippingOptionsWorkflowInput>) => {
    validateMandatoryShippingOptionRemovalStep({
      seller_id: input.seller_id,
      shipping_option_ids: input.ids,
    })

    deleteShippingOptionsWorkflow.runAsStep({
      input: { ids: input.ids },
    })

    return new WorkflowResponse(void 0)
  }
)
