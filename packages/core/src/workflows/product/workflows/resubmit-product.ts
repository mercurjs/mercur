import {
  createWorkflow,
  createHook,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { ProductStatus, ProductChangeActionType } from "@mercurjs/types"

import { ProductWorkflowEvents } from "../events"
import {
  validateResubmitProductStep,
  createProductChangesStep,
  createProductChangeActionsStep,
  updateProductsStep,
} from "../steps"

export const resubmitProductWorkflowId = "resubmit-product"

type ResubmitProductWorkflowInput = {
  product_id: string
}

export const resubmitProductWorkflow = createWorkflow(
  resubmitProductWorkflowId,
  function (input: ResubmitProductWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-product" })

    const product = transform({ products }, ({ products }) => products[0])

    validateResubmitProductStep({ product })

    const changeData = transform({ product }, ({ product }) => [
      { product_id: product.id },
    ])

    const changes = createProductChangesStep(changeData)

    const actionData = transform(
      { changes, product },
      ({ changes, product }) => [
        {
          product_change_id: changes[0].id,
          product_id: product.id,
          action: ProductChangeActionType.STATUS_CHANGE,
          details: { status: ProductStatus.PROPOSED },
        },
      ]
    )

    createProductChangeActionsStep(actionData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_id },
      data: { status: ProductStatus.PROPOSED },
    }))

    updateProductsStep(updateInput)

    emitEventStep({
      eventName: ProductWorkflowEvents.RESUBMITTED,
      data: { id: input.product_id },
    })

    const productResubmitted = createHook("productResubmitted", {
      product_id: input.product_id,
    })

    return new WorkflowResponse(void 0, { hooks: [productResubmitted] })
  }
)
