import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  CreateProductChangeActionDTO,
  ProductChangeDTO,
  ProductChangeStatus,
} from "@mercurjs/types"

import { ProductChangeWorkflowEvents } from "../events"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../steps"
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

export type StageProductChangeWorkflowInput = {
  product_id: string
  /**
   * Seller / system that created the staged change. Persisted on
   * `ProductChange.created_by` and forwarded as `confirmed_by` when
   * `autoConfirmProductChangeWorkflow` inline-applies the change
   * (PRODUCT_REQUEST=false).
   */
  created_by?: string
  /**
   * Actions to attach. `product_change_id` is stamped inside the
   * workflow; pass `applied: false` (or omit — the dispatcher sets it
   * to `true` after it runs).
   */
  actions: Array<
    Omit<CreateProductChangeActionDTO, "product_change_id">
  >
  internal_note?: string
  external_note?: string
  /**
   * Force inline confirmation regardless of the `PRODUCT_REQUEST`
   * feature flag. Forwarded to `autoConfirmProductChangeWorkflow`.
   * Used by `productEditDeleteProductWorkflow` for `draft` products.
   */
  auto_confirm?: boolean
}

export const stageProductChangeWorkflowId = "stage-product-change"

/**
 * Building block for vendor "edit" orchestrators. Creates one
 * `ProductChange { status: PENDING }`, attaches the caller-computed
 * `ProductChangeAction[]`, emits `product-change.created`, and
 * dispatches via `autoConfirmProductChangeWorkflow` (inline-applies
 * when `PRODUCT_REQUEST` is off, leaves pending otherwise).
 *
 * **Validation ordering** — callers must run
 * `validateNoPendingProductChangeStep` themselves BEFORE invoking
 * this workflow. Some callers (e.g. `productEditUpdateAttributesWorkflow`)
 * materialise product-scoped attribute records between validation and
 * staging, so validation cannot be bundled here without risking
 * orphan attribute rows on a failed pending check.
 */
export const stageProductChangeWorkflow = createWorkflow(
  stageProductChangeWorkflowId,
  function (input: StageProductChangeWorkflowInput) {
    const changes = createProductChangesStep(
      transform({ input }, ({ input }) => [
        {
          product_id: input.product_id,
          created_by: input.created_by,
          status: ProductChangeStatus.PENDING,
          internal_note: input.internal_note,
          external_note: input.external_note,
        },
      ]),
    )

    const stampedActions = transform(
      { input, changes },
      ({ input, changes }) => {
        const product_change_id = changes[0]?.id as string
        return input.actions.map(
          (a) =>
            ({
              ...a,
              product_change_id,
            }) as CreateProductChangeActionDTO,
        )
      },
    )

    createProductChangeActionsStep(stampedActions)

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
        force: input.auto_confirm,
      })),
    })

    return new WorkflowResponse(
      transform(
        { changes },
        ({ changes }) => changes[0] as unknown as ProductChangeDTO,
      ),
    )
  },
)
