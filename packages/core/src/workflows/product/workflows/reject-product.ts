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
import {
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validateRejectProductStep } from "../steps/validate-reject-product"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../../product-edit/steps"

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

    const product = transform({ products }, ({ products }) => products[0])

    validateRejectProductStep({ product })

    const changeData = transform(
      { product, input },
      ({ product, input }) => [
        {
          product_id: product.id as string,
          created_by: input.actor_id,
          status: ProductChangeStatus.CONFIRMED,
          confirmed_by: input.actor_id,
          confirmed_at: new Date(),
          external_note: input.message,
        },
      ],
    )

    const changes = createProductChangesStep(changeData)

    const actionData = transform(
      { changes, product },
      ({ changes, product }) => [
        {
          product_change_id: changes[0].id as string,
          product_id: product.id as string,
          action: ProductChangeActionType.STATUS_CHANGE,
          details: { status: ProductStatus.REJECTED },
          applied: true,
        },
      ],
    )

    createProductChangeActionsStep(actionData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      update: { status: ProductStatus.REJECTED },
    }))

    updateProductsStep(updateInput)

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
