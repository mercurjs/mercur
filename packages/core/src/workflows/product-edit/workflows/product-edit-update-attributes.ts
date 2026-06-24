import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateProductChangeActionDTO,
  ProductAttributeBatchAdd,
  ProductAttributeBatchUpdate,
  ProductChangeActionType,
  ProductChangeDTO,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

export type ProductEditUpdateAttributesWorkflowInput = {
  product_id: string
  created_by?: string
  add?: ProductAttributeBatchAdd[]
  remove?: string[]
  update?: ProductAttributeBatchUpdate[]
} & AdditionalData

export const productEditUpdateAttributesWorkflowId =
  "product-edit-update-attributes"

export const productEditUpdateAttributesWorkflow: ReturnWorkflow<
  ProductEditUpdateAttributesWorkflowInput,
  ProductChangeDTO,
  []
> = createWorkflow(
  productEditUpdateAttributesWorkflowId,
  function (input: ProductEditUpdateAttributesWorkflowInput) {
    validateNoPendingProductChangeStep(
      transform({ input }, ({ input }) => ({
        product_ids: [input.product_id],
      })),
    )

    const actions = transform({ input }, ({ input }) => {
      const acts: Array<
        Omit<CreateProductChangeActionDTO, "product_change_id">
      > = []

      for (const attribute of input.add ?? []) {
        acts.push({
          product_id: input.product_id,
          action: ProductChangeActionType.ATTRIBUTE_ADD,
          details: { attribute },
        })
      }

      for (const attribute_id of input.remove ?? []) {
        acts.push({
          product_id: input.product_id,
          action: ProductChangeActionType.ATTRIBUTE_REMOVE,
          details: { attribute_id },
        })
      }

      for (const update of input.update ?? []) {
        acts.push({
          product_id: input.product_id,
          action: ProductChangeActionType.ATTRIBUTE_UPDATE,
          details: { update },
        })
      }

      return acts
    })

    const change = stageProductChangeWorkflow.runAsStep({
      input: transform({ input, actions }, ({ input, actions }) => ({
        product_id: input.product_id,
        created_by: input.created_by,
        actions,
      })),
    })

    return new WorkflowResponse(change)
  },
)
