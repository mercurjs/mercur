import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  ProductChangeActionType,
  ProductChangeStatus,
} from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import { validateRequestProductChangeStep } from "../steps/validate-request-product-change"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../../product-edit/steps"

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
 *   2. Stamp a confirmed `ProductChange` audit row carrying one
 *      `CHANGE_REQUESTED` action (`applied: true`). The operator's
 *      optional `message` lands on `external_note` so the seller sees
 *      it on their product detail panel.
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

    const product = transform({ products }, ({ products }) => products[0])

    validateRequestProductChangeStep({ product })

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
      { changes, product, input },
      ({ changes, product, input }) => [
        {
          product_change_id: changes[0].id as string,
          product_id: product.id as string,
          action: ProductChangeActionType.CHANGE_REQUESTED,
          details: { message: input.message ?? null },
          applied: true,
        },
      ],
    )

    createProductChangeActionsStep(actionData)

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
