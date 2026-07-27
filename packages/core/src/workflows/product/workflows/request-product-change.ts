import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ProductStatus } from "@medusajs/framework/utils"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { ProductChangeActionType } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { ProductWorkflowEvents } from "../events"
import { validateProductsStatusStep } from "../steps/validate-products-status"
import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"

export const requestProductChangeWorkflowId = "mercur-request-product-change"

type RequestProductChangeWorkflowInput = {
  product_id: string
  message?: string
  actor_id?: string
} & AdditionalData

export const requestProductChangeWorkflow = createWorkflow(
  requestProductChangeWorkflowId,
  function (input: RequestProductChangeWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    validateProductsStatusStep({
      products,
      expected_status: ProductStatus.PROPOSED,
    })

    recordProductAuditChangeWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        actor_id: input.actor_id,
        changes: [
          {
            product_id: input.product_id,
            external_note: input.message,
            actions: [
              {
                product_id: input.product_id,
                action: ProductChangeActionType.CHANGE_REQUESTED,
                details: { message: input.message ?? null },
              },
            ],
          },
        ],
      })),
    })

    emitEventStep({
      eventName: ProductWorkflowEvents.CHANGE_REQUESTED,
      data: transform({ input }, ({ input }) => ({
        id: input.product_id,
        message: input.message,
        actor_id: input.actor_id,
      })),
    })

    const productChangeRequested = createHook("productChangeRequested", {
      product_id: input.product_id,
      message: input.message,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, { hooks: [productChangeRequested] })
  },
)
