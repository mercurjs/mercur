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
}

export const autoConfirmProductChangeWorkflowId = "auto-confirm-product-change"

/**
 * Runs `confirmProductChangeWorkflow` inline when the
 * `PRODUCT_REQUEST` feature flag is disabled. Lets the seller's edit
 * staging workflows always create a `ProductChange`; the change is
 * either left pending for admin approval (flag on) or auto-applied
 * (flag off). Marketplaces that don't need an approval queue toggle
 * `MEDUSA_FF_PRODUCT_REQUEST=false` and get direct-mutation UX without
 * the routes diverging.
 */
export const autoConfirmProductChangeWorkflow: ReturnWorkflow<
  AutoConfirmProductChangeWorkflowInput,
  void,
  []
> = createWorkflow(
  autoConfirmProductChangeWorkflowId,
  function (input: AutoConfirmProductChangeWorkflowInput) {
    when(
      { input },
      () => !FeatureFlag.isFeatureEnabled(MercurFeatureFlags.PRODUCT_REQUEST),
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
