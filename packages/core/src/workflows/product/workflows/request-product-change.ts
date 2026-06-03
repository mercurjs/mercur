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

import { ProductWorkflowEvents } from "../events"
import { validateProductsStatusStep } from "../steps/validate-products-status"
import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"

export const requestProductChangeWorkflowId = "mercur-request-product-change"

type RequestProductChangeWorkflowInput = {
  product_id: string
  message?: string
  actor_id?: string
}

/**
 * Admin-side "ask the vendor to revise the submission". Deliberately
 * side-effect-free on the product itself — the status stays where it
 * is. All this workflow does:
 *
 *   1. Validate the product is eligible (still in the publish-approval
 *      window).
 *   2. Record a confirmed `ProductChange` audit row carrying one
 *      pre-applied `CHANGE_REQUESTED` action (via
 *      `recordProductAuditChangeWorkflow`). The operator's optional
 *      `message` lands on `external_note` so the seller sees it.
 *   3. Emit `product.change-requested` so a notification handler can
 *      ship an email.
 */
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
    })

    return new WorkflowResponse(void 0, { hooks: [productChangeRequested] })
  },
)
