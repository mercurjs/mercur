import {
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateMarketplaceShippingMethodDTO,
  UpdateMarketplaceShippingMethodDTO,
} from "@mercurjs/types"

import {
  createShippingMethodsStep,
  deleteShippingMethodsStep,
  updateShippingMethodsStep,
  validateShippingMethodReferencesStep,
} from "../steps"

export const createShippingMethodsWorkflowId = "create-shipping-methods"

export const createShippingMethodsWorkflow = createWorkflow(
  createShippingMethodsWorkflowId,
  (input: WorkflowData<{ shipping_methods: CreateMarketplaceShippingMethodDTO[] }>) => {
    validateShippingMethodReferencesStep(input.shipping_methods)
    const methods = createShippingMethodsStep(input.shipping_methods)
    return new WorkflowResponse(methods)
  }
)

export const updateShippingMethodsWorkflowId = "update-shipping-methods"

export const updateShippingMethodsWorkflow = createWorkflow(
  updateShippingMethodsWorkflowId,
  (input: WorkflowData<{ shipping_methods: UpdateMarketplaceShippingMethodDTO[] }>) => {
    const methods = updateShippingMethodsStep(input.shipping_methods)
    return new WorkflowResponse(methods)
  }
)

export const deleteShippingMethodsWorkflowId = "delete-shipping-methods"

export const deleteShippingMethodsWorkflow = createWorkflow(
  deleteShippingMethodsWorkflowId,
  (input: WorkflowData<{ ids: string[] }>) => {
    deleteShippingMethodsStep(input.ids)
    return new WorkflowResponse(void 0)
  }
)
