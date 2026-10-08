import type {
  Hook,
  ReturnWorkflow,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import {
  updateCartPromotionsWorkflow as medusaUpdateCartPromotionsWorkflow,
  type PrepareAdjustmentsFromPromotionActionsStepOutput,
  type UpdateCartPromotionsWorkflowInput,
} from "@medusajs/medusa/core-flows"

export type FilterAdjustmentsHookInput = {
  lineItemAdjustmentsToCreate: WorkflowData<
    PrepareAdjustmentsFromPromotionActionsStepOutput["lineItemAdjustmentsToCreate"]
  >
  shippingMethodAdjustmentsToCreate: WorkflowData<
    PrepareAdjustmentsFromPromotionActionsStepOutput["shippingMethodAdjustmentsToCreate"]
  >
}

export type FilterAdjustmentsHookResult =
  | Partial<
      Pick<
        PrepareAdjustmentsFromPromotionActionsStepOutput,
        "lineItemAdjustmentsToCreate" | "shippingMethodAdjustmentsToCreate"
      >
    >
  | undefined

export type UpdateCartPromotionsWorkflowHooks = [
  Hook<
    "validate",
    { input: WorkflowData<UpdateCartPromotionsWorkflowInput>; cart: unknown },
    unknown
  >,
  Hook<
    "setPromotionContext",
    {
      cart: unknown
      action: WorkflowData<string>
      promo_codes: WorkflowData<string[]>
    },
    Record<string, unknown> | undefined
  >,
  Hook<
    "filterAdjustments",
    FilterAdjustmentsHookInput,
    FilterAdjustmentsHookResult
  >,
]

// filterAdjustments comes from the core-flows promotion-filter-hook patch, which
// is applied in memory and cannot reach Medusa's shipped typings, so the patched
// shape is asserted here. Keep in sync with
// patches/@medusajs+core-flows@*-promotion-filter-hook.patch.
export const updateCartPromotionsWorkflow =
  medusaUpdateCartPromotionsWorkflow as unknown as ReturnWorkflow<
    UpdateCartPromotionsWorkflowInput,
    { skipped_promo_codes: { code: string; reason: string }[] },
    UpdateCartPromotionsWorkflowHooks
  >
