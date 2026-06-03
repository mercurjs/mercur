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
import { validateRequestProductChangesStep } from "../steps/validate-request-product-changes"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../../product-edit/steps"

export const requestProductRevisionWorkflowId = "mercur-request-product-revision"

type RequestProductChangesWorkflowInput = {
  product_id: string
  message?: string
  actor_id?: string
}

/**
 * Admin-side "ask the seller to revise the submission". Same audit-
 * trail pattern as confirm + reject, transitioning the product to
 * `draft` so the seller can edit and re-propose. The operator
 * `message` lands on the change's `external_note` so the seller sees
 * the reason on their product detail panel.
 */
export const requestProductRevisionWorkflow = createWorkflow(
  requestProductRevisionWorkflowId,
  function (input: RequestProductChangesWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    const product = transform({ products }, ({ products }) => products[0])

    validateRequestProductChangesStep({ product })

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
          details: { status: ProductStatus.DRAFT },
          applied: true,
        },
      ],
    )

    createProductChangeActionsStep(actionData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      update: { status: ProductStatus.DRAFT },
    }))

    updateProductsStep(updateInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.REQUIRES_ACTION,
      data: transform({ input }, ({ input }) => ({
        id: input.product_id,
        message: input.message,
      })),
    })

    const productRequiresAction = createHook("productRequiresAction", {
      product_id: input.product_id,
      message: input.message,
    })

    return new WorkflowResponse(void 0, { hooks: [productRequiresAction] })
  },
)
