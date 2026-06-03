import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  ProductChangeActionType,
  ProductChangeDTO,
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

    const change = stageProductChangeWorkflow.runAsStep({
      input: transform({ input }, ({ input }) => ({
        product_id: input.product_id,
        created_by: input.created_by,
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
