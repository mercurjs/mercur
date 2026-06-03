import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateProductChangeActionDTO,
  ProductChangeDTO,
  ProductChangeStatus,
} from "@mercurjs/types"

import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../steps"

export type RecordProductAuditChangeWorkflowInput = {
  /**
   * The actor recording the audit row — written to both `created_by`
   * and `confirmed_by` on every created `ProductChange`. Optional for
   * system-driven audit rows.
   */
  actor_id?: string
  changes: Array<{
    product_id: string
    internal_note?: string
    external_note?: string
    /**
     * Actions to attach to the change. `product_change_id` is stamped
     * inside the workflow; `applied` is forced to `true` (this workflow
     * is for audit rows where side effects have already run).
     */
    actions: Array<
      Omit<CreateProductChangeActionDTO, "product_change_id" | "applied">
    >
  }>
}

export const recordProductAuditChangeWorkflowId = "record-product-audit-change"

/**
 * Building block for "audit-only" product changes — every change is
 * born `CONFIRMED` with `confirmed_by` / `confirmed_at` populated and
 * every action attached with `applied: true`. The dispatcher
 * (`applyProductChangeActionsWorkflow`) is not invoked because the
 * caller has either already applied the side effect (e.g.
 * `updateProductsStep` for status flips) or there is no side effect
 * (e.g. `CHANGE_REQUESTED` is informational).
 *
 * Used by: `confirmProductsWorkflow`, `rejectProductWorkflow`,
 * `requestProductChangeWorkflow`, and the seller-branch audit row in
 * `createProductsWorkflow`. Callers emit their own domain event (e.g.
 * `product.published`) alongside.
 */
export const recordProductAuditChangeWorkflow = createWorkflow(
  recordProductAuditChangeWorkflowId,
  function (input: RecordProductAuditChangeWorkflowInput) {
    const changeData = transform({ input }, ({ input }) => {
      const confirmedAt = new Date()
      return input.changes.map((c) => ({
        product_id: c.product_id,
        created_by: input.actor_id,
        status: ProductChangeStatus.CONFIRMED,
        confirmed_by: input.actor_id,
        confirmed_at: confirmedAt,
        internal_note: c.internal_note,
        external_note: c.external_note,
      }))
    })

    const changes = createProductChangesStep(changeData)

    const actionData = transform(
      { input, changes },
      ({ input, changes }) => {
        const out: CreateProductChangeActionDTO[] = []
        input.changes.forEach((c, idx) => {
          const product_change_id = changes[idx]?.id as string
          for (const action of c.actions) {
            out.push({
              ...action,
              product_change_id,
              applied: true,
            } as CreateProductChangeActionDTO)
          }
        })
        return out
      },
    )

    createProductChangeActionsStep(actionData)

    return new WorkflowResponse(
      transform(
        { changes },
        ({ changes }) => changes as unknown as ProductChangeDTO[],
      ),
    )
  },
)
