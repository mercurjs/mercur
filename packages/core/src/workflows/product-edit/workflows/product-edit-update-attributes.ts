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
  /** Attributes to attach. See {@link ProductAttributeBatchAdd}. */
  add?: ProductAttributeBatchAdd[]
  /** The ids of the attributes to detach from the product. */
  remove?: string[]
  /** The attribute selections to mutate. See {@link ProductAttributeBatchUpdate}. */
  update?: ProductAttributeBatchUpdate[]
} & AdditionalData

export const productEditUpdateAttributesWorkflowId =
  "product-edit-update-attributes"

/**
 * Vendor "edit product attributes" orchestrator. Translates a
 * {@link ProductAttributeBatchInput} (`add` / `remove` / `update`) into one
 * `ProductChangeAction` per entry on a fresh `ProductChange` via
 * `stageProductChangeWorkflow`:
 *
 * - each `add` entry → `ATTRIBUTE_ADD` `{ attribute }`
 * - each `remove` id → `ATTRIBUTE_REMOVE` `{ attribute_id }`
 * - each `update` entry → `ATTRIBUTE_UPDATE` `{ update }`
 *
 * The raw batch op is carried verbatim in the action `details` (mirroring how
 * `productEditUpdateVariantsWorkflow` stores the variant payload). At confirm
 * time `applyProductChangeActionsWorkflow` reconstructs a per-product
 * `ProductAttributeBatchInput` from these actions and re-runs the SPEC-014
 * batch engine (`createAndLinkProductAttributesToProductWorkflow`), so all
 * axis / exclusive / scoped / text / unit / toggle semantics are preserved —
 * only the trigger point moves from the request to the (auto-)confirm.
 *
 * The shared `stageProductChangeWorkflow` runs the auto-confirm conditional, so
 * the change applies inline when `PRODUCT_REQUEST` is disabled and otherwise
 * stays pending for admin approval.
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
