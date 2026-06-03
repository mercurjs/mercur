import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ProductStatus } from "@medusajs/framework/utils"
import {
  emitEventStep,
  updateProductsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validateProductsStatusStep } from "../steps/validate-products-status"
import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"

export const rejectProductWorkflowId = "mercur-reject-product"

type RejectProductWorkflowInput = {
  product_id: string
  message?: string
  actor_id?: string
}

/**
 * Admin-side "reject a vendor submission". Same audit-trail shape as
 * `confirmProductsWorkflow`, ending in `status: rejected`. The
 * operator's optional `message` is mirrored onto the change's
 * `external_note` so the seller sees it on their product detail
 * panel.
 */
export const rejectProductWorkflow = createWorkflow(
  rejectProductWorkflowId,
  function (input: RejectProductWorkflowInput) {
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
                action: ProductChangeActionType.STATUS_CHANGE,
                details: { status: ProductStatus.REJECTED },
              },
            ],
          },
        ],
      })),
    })

    updateProductsStep(
      transform({ input }, ({ input }) => ({
        selector: { id: input.product_id },
        update: { status: ProductStatus.REJECTED },
      })),
    )

    emitEventStep({
      eventName: ProductWorkflowEvents.REJECTED,
      data: transform({ input }, ({ input }) => ({
        id: input.product_id,
        message: input.message,
      })),
    })

    const productRejected = createHook("productRejected", {
      product_id: input.product_id,
      message: input.message,
    })

    return new WorkflowResponse(void 0, { hooks: [productRejected] })
  },
)
