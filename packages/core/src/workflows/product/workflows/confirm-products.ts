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
import { validateConfirmProductsStep } from "../steps/validate-confirm-products"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../../product-edit/steps"

export const confirmProductsWorkflowId = "mercur-confirm-products"

type ConfirmProductsWorkflowInput = {
  product_ids: string[]
  actor_id?: string
  /**
   * Operator-only note persisted onto `ProductChange.internal_note`
   * for each confirmed product. Optional.
   */
  internal_note?: string
}

/**
 * Admin-side "publish a vendor submission". Mirrors the audit-trail
 * pattern used by `createProductsWorkflow`:
 *
 *   1. Load + validate the products are `proposed`.
 *   2. Stamp one `ProductChange` per product, already `CONFIRMED`
 *      with `confirmed_by` / `confirmed_at` set — no admin queue, the
 *      change is the audit row.
 *   3. Attach a `STATUS_CHANGE` action recording the new status as
 *      already `applied`. Lets downstream history readers reconstruct
 *      "who published this and when" without joining to the events
 *      bus.
 *   4. Apply the actual product status update.
 *   5. Emit `product.published` so notifications / search reindex.
 */
export const confirmProductsWorkflow = createWorkflow(
  confirmProductsWorkflowId,
  function (input: ConfirmProductsWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_ids },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-products" })

    validateConfirmProductsStep({ products })

    const changeData = transform(
      { products, input },
      ({ products, input }) =>
        products.map((product) => ({
          product_id: product.id as string,
          created_by: input.actor_id,
          status: ProductChangeStatus.CONFIRMED,
          confirmed_by: input.actor_id,
          confirmed_at: new Date(),
          internal_note: input.internal_note,
        })),
    )

    const changes = createProductChangesStep(changeData)

    const actionData = transform(
      { products, changes },
      ({ products, changes }) =>
        products.map((product, index) => ({
          product_change_id: changes[index].id as string,
          product_id: product.id as string,
          action: ProductChangeActionType.STATUS_CHANGE,
          details: { status: ProductStatus.PUBLISHED },
          applied: true,
        })),
    )

    createProductChangeActionsStep(actionData)

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.product_ids },
      update: { status: ProductStatus.PUBLISHED },
    }))

    updateProductsStep(updateInput)

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
    })

    return new WorkflowResponse(void 0, { hooks: [productsConfirmed] })
  },
)
