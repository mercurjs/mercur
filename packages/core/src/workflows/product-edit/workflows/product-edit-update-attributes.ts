import { AdditionalData } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateProductChangeActionDTO,
  ProductChangeActionType,
  ProductChangeDTO,
} from "@mercurjs/types"

import { validateNoPendingProductChangeStep } from "../steps"
import { resolveAttributeAddActionsStep } from "../../product-attribute/steps"
import { stageProductChangeWorkflow } from "./stage-product-change"

/**
 * Existing-attribute reference passed by the vendor. `value_ids` are
 * `ProductAttributeValue` ids; `values` are names resolved (or created, for
 * free-form text/unit) by `resolveAttributeAddActionsStep`.
 */
export type ProductEditAttributeAddOperation = {
  type: "add"
  attribute_id: string
  value_ids?: string[]
  values?: string[]
}

export type ProductEditAttributeRemoveOperation = {
  type: "remove"
  attribute_id: string
}

export type ProductEditAttributeOperation =
  | ProductEditAttributeAddOperation
  | ProductEditAttributeRemoveOperation

export type ProductEditUpdateAttributesWorkflowInput = {
  product_id: string
  created_by?: string
  operations: ProductEditAttributeOperation[]
} & AdditionalData

export const productEditUpdateAttributesWorkflowId =
  "product-edit-update-attributes"

/**
 * SPEC-014 vendor "edit product attributes" — stages `ATTRIBUTE_ADD` /
 * `ATTRIBUTE_REMOVE` change actions (existing refs only). The confirm-time
 * dispatcher (`applyProductAttributeChangeActionsWorkflow`) applies them onto
 * the native-option model. Free-form text/unit values are created up-front so
 * the staged action carries resolved ids.
 */
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

    const addActions = resolveAttributeAddActionsStep(
      transform({ input }, ({ input }) => ({
        product_id: input.product_id,
        add_ops: (input.operations ?? [])
          .filter((op) => op.type === "add")
          .map((op) => ({
            attribute_id: (op as ProductEditAttributeAddOperation).attribute_id,
            value_ids: (op as ProductEditAttributeAddOperation).value_ids,
            values: (op as ProductEditAttributeAddOperation).values,
          })),
      })),
    )

    const actions = transform(
      { input, addActions },
      ({ input, addActions }) => {
        const acts: Array<
          Omit<CreateProductChangeActionDTO, "product_change_id">
        > = []

        for (const a of addActions) {
          acts.push({
            product_id: a.product_id,
            action: ProductChangeActionType.ATTRIBUTE_ADD,
            details: {
              attribute_id: a.attribute_id,
              attribute_value_ids: a.attribute_value_ids,
            },
          })
        }

        for (const op of input.operations ?? []) {
          if (op.type !== "remove") continue
          acts.push({
            product_id: input.product_id,
            action: ProductChangeActionType.ATTRIBUTE_REMOVE,
            details: { attribute_id: op.attribute_id },
          })
        }

        return acts
      },
    )

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
