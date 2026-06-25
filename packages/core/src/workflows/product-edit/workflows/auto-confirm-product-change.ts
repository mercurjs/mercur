import { FeatureFlag } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { MercurFeatureFlags } from "@mercurjs/types"

import { confirmProductChangeWorkflow } from "./confirm-product-change"

export type AutoConfirmProductChangeWorkflowInput = {
  change_id: string
  confirmed_by?: string
  force?: boolean
}

export const autoConfirmProductChangeWorkflowId = "auto-confirm-product-change"

export const autoConfirmProductChangeWorkflow: ReturnWorkflow<
  AutoConfirmProductChangeWorkflowInput,
  void,
  []
> = createWorkflow(
  autoConfirmProductChangeWorkflowId,
  function (input: AutoConfirmProductChangeWorkflowInput) {
    when(
      { input },
      ({ input }) =>
        Boolean(input.force) ||
        !FeatureFlag.isFeatureEnabled(MercurFeatureFlags.PRODUCT_REQUEST),
    ).then(() => {
      confirmProductChangeWorkflow.runAsStep({
        input: transform({ input }, ({ input }) => ({
          ids: [input.change_id],
          confirmed_by: input.confirmed_by,
        })),
      })
    })

    return new WorkflowResponse(void 0)
  },
)
