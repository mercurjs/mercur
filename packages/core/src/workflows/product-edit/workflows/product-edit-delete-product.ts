import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  ProductChangeActionType,
  ProductChangeDTO,
  ProductStatus,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

export type ProductEditDeleteProductWorkflowInput = {
  product_id: string
  created_by?: string
} & AdditionalData

export const productEditDeleteProductWorkflowId =
  "product-edit-delete-product"

/**
 * Vendor "delete product" orchestrator. Stages a `PRODUCT_DELETE`
 * action on a fresh `ProductChange` via `stageProductChangeWorkflow`,
 * which dispatches through `autoConfirmProductChangeWorkflow` —
 * either leaves it pending for admin approval (flag on) or applies it
 * inline (flag off).
 *
 * **Drafts skip the queue.** A `draft` product was never submitted for
 * review, so there is nothing for an operator to approve. The staged
 * change is force-confirmed inline (via `auto_confirm`) regardless of
 * the `PRODUCT_REQUEST` flag, so the seller can delete it immediately.
 */
export const productEditDeleteProductWorkflow: ReturnWorkflow<
  ProductEditDeleteProductWorkflowInput,
  ProductChangeDTO,
  []
> = createWorkflow(
  productEditDeleteProductWorkflowId,
  function (input: ProductEditDeleteProductWorkflowInput) {
    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
      })),
    )

    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "delete-load-product" })

    const change = stageProductChangeWorkflow.runAsStep({
      input: transform({ input, products }, ({ input, products }) => ({
        product_id: input.product_id,
        created_by: input.created_by,
        auto_confirm: products[0]?.status === ProductStatus.DRAFT,
        actions: [
          {
            product_id: input.product_id,
            action: ProductChangeActionType.PRODUCT_DELETE,
            details: {},
          },
        ],
      })),
    })

    return new WorkflowResponse(change)
  },
)
