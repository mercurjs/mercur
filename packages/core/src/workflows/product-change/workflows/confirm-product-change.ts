import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

import { ProductChangeWorkflowEvents } from "../events"
import {
  confirmProductChangeValidationStep,
  confirmProductChangesStep,
} from "../steps"
import { applyProductChangeActionsWorkflow } from "./apply-product-change-actions"

export type ConfirmProductChangeWorkflowInput = {
  ids: string[]
  confirmed_by?: string
  internal_note?: string
  external_note?: string
} & AdditionalData

export type ConfirmProductChangeWorkflowHooks = [
  Hook<"validate", { input: ConfirmProductChangeWorkflowInput }, unknown>,
  Hook<
    "productChangeConfirmed",
    {
      ids: string[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const confirmProductChangeWorkflowId = "confirm-product-change"

/**
 * Mirrors `confirm-order-edit-request.ts`:
 * 1. `useQueryGraphStep` (load change),
 * 2. `confirmProductChangeValidationStep` (status guard),
 * 3. `confirmProductChangesStep` (mutation),
 * 4. `applyProductChangeActionsWorkflow.runAsStep` — dispatches the
 *    confirmed change's pending actions into stock product workflows
 *    and Module-Link writes (replaces the legacy
 *    `ProductModuleService.applyProductChangeActions_`).
 * 5. `emitEventStep` → `createHook("productChangeConfirmed", …)`.
 */
export const confirmProductChangeWorkflow: ReturnWorkflow<
  ConfirmProductChangeWorkflowInput,
  void,
  ConfirmProductChangeWorkflowHooks
> = createWorkflow(
  confirmProductChangeWorkflowId,
  function (input: ConfirmProductChangeWorkflowInput) {
    const validate = createHook("validate", { input })

    const { data: changes } = useQueryGraphStep({
      entity: "product_change",
      fields: ["id", "status"],
      filters: { id: input.ids },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "pc-load-changes" })

    confirmProductChangeValidationStep({
      changes,
      expected_ids: input.ids,
    })

    const confirmInput = transform({ input }, ({ input }) =>
      input.ids.map((id) => ({
        id,
        confirmed_by: input.confirmed_by,
        internal_note: input.internal_note,
        external_note: input.external_note,
      })),
    )

    confirmProductChangesStep(confirmInput)

    applyProductChangeActionsWorkflow.runAsStep({
      input: { change_ids: input.ids },
    })

    emitEventStep({
      eventName: ProductChangeWorkflowEvents.CONFIRMED,
      data: transform({ input }, ({ input }) =>
        input.ids.map((id) => ({ id })),
      ),
    })

    const productChangeConfirmed = createHook("productChangeConfirmed", {
      ids: input.ids,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, productChangeConfirmed],
    })
  },
)
