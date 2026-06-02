import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  ProductChangeActionType,
  ProductChangeDTO,
  ProductChangeStatus,
} from "@mercurjs/types"

import { ProductChangeWorkflowEvents } from "../events"
import {
  createProductChangeActionsStep,
  createProductChangeStep,
  validateNoPendingProductChangeStep,
} from "../steps"
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

export type ProductEditDeleteProductWorkflowInput = {
  product_id: string
  created_by?: string
} & AdditionalData

export const productEditDeleteProductWorkflowId =
  "product-edit-delete-product"

/**
 * Vendor "delete product" orchestrator. Stages a `PRODUCT_DELETE`
 * action on a fresh `ProductChange` and lets
 * `autoConfirmProductChangeWorkflow` either leave it pending for
 * admin approval (flag on) or apply it inline (flag off).
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

    const changes = createProductChangeStep(
      transform({ input }, ({ input }) => [
        {
          product_id: input.product_id,
          created_by: input.created_by,
          status: ProductChangeStatus.PENDING,
        },
      ]),
    )

    createProductChangeActionsStep(
      transform({ input, changes }, ({ input, changes }) => [
        {
          product_change_id: changes[0]?.id as string,
          product_id: input.product_id,
          action: ProductChangeActionType.PRODUCT_DELETE,
          details: {},
        },
      ]),
    )

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.CREATED,
      data: transform({ changes }, ({ changes }) => ({
        id: changes[0]?.id,
      })),
    })

    autoConfirmProductChangeWorkflow.runAsStep({
      input: transform({ changes, input }, ({ changes, input }) => ({
        change_id: changes[0]?.id as string,
        confirmed_by: input.created_by,
      })),
    })

    return new WorkflowResponse(
      transform({ changes }, ({ changes }) => changes[0] as ProductChangeDTO),
    )
  },
)
