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
  actor_id?: string
  changes: Array<{
    product_id: string
    internal_note?: string
    external_note?: string
    actions: Array<
      Omit<CreateProductChangeActionDTO, "product_change_id" | "applied">
    >
  }>
}

export const recordProductAuditChangeWorkflowId = "record-product-audit-change"

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
