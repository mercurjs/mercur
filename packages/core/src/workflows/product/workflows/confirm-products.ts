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
import { AdditionalData } from "@medusajs/framework/types"

import { ProductWorkflowEvents } from "../events"
import { validateProductsStatusStep } from "../steps/validate-products-status"
import { recordProductAuditChangeWorkflow } from "../../product-edit/workflows/record-product-audit-change"

export const confirmProductsWorkflowId = "mercur-confirm-products"

type ConfirmProductsWorkflowInput = {
  product_ids: string[]
  actor_id?: string
  internal_note?: string
} & AdditionalData

export const confirmProductsWorkflow = createWorkflow(
  confirmProductsWorkflowId,
  function (input: ConfirmProductsWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_ids },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-products" })

    validateProductsStatusStep({
      products,
      expected_status: ProductStatus.PROPOSED,
    })

    recordProductAuditChangeWorkflow.runAsStep({
      input: transform({ products, input }, ({ products, input }) => ({
        actor_id: input.actor_id,
        changes: products.map((product) => ({
          product_id: product.id as string,
          internal_note: input.internal_note,
          actions: [
            {
              product_id: product.id as string,
              action: ProductChangeActionType.STATUS_CHANGE,
              details: { status: ProductStatus.PUBLISHED },
            },
          ],
        })),
      })),
    })

    updateProductsStep(
      transform({ input }, ({ input }) => ({
        selector: { id: input.product_ids },
        update: { status: ProductStatus.PUBLISHED },
      })),
    )

    emitEventStep({
      eventName: ProductWorkflowEvents.PUBLISHED,
      data: transform({ input }, ({ input }) =>
        input.product_ids.map((id) => ({
          id,
          internal_note: input.internal_note,
        })),
      ),
    })

    const productsConfirmed = createHook("productsConfirmed", {
      product_ids: input.product_ids,
      internal_note: input.internal_note,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, { hooks: [productsConfirmed] })
  },
)
