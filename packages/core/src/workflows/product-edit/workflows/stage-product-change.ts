import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep, useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  CreateProductChangeActionDTO,
  ProductChangeDTO,
  ProductChangeStatus,
  ProductStatus,
} from "@mercurjs/types"

import { ProductChangeWorkflowEvents } from "../events"
import {
  createProductChangeActionsStep,
  createProductChangesStep,
} from "../steps"
import { autoConfirmProductChangeWorkflow } from "./auto-confirm-product-change"

export type StageProductChangeWorkflowInput = {
  product_id: string
  created_by?: string
  actions: Array<
    Omit<CreateProductChangeActionDTO, "product_change_id">
  >
  internal_note?: string
  external_note?: string
  auto_confirm?: boolean
}

export const stageProductChangeWorkflowId = "stage-product-change"

// Unpublished products are reviewed as a whole when they go live, so edits
// to them never wait for a separate approval.
const UNREVIEWED_STATUSES: string[] = [
  ProductStatus.DRAFT,
  ProductStatus.PROPOSED,
]

export const stageProductChangeWorkflow = createWorkflow(
  stageProductChangeWorkflowId,
  function (input: StageProductChangeWorkflowInput) {
    const { data: products } = useQueryGraphStep({
      entity: "product",
      fields: ["id", "status"],
      filters: { id: input.product_id },
    }).config({ name: "stage-product-change-load-product" })

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
      input: transform(
        { changes, input, products },
        ({ changes, input, products }) => ({
          change_id: changes[0]?.id as string,
          confirmed_by: input.created_by,
          force:
            input.auto_confirm ??
            UNREVIEWED_STATUSES.includes(products[0]?.status as string),
        }),
      ),
    })

    return new WorkflowResponse(
      transform(
        { changes },
        ({ changes }) => changes[0] as unknown as ProductChangeDTO,
      ),
    )
  },
)
