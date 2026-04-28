import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { SellerStatus } from "@mercurjs/types"

import { validateSuspendSellerStep, updateSellersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const suspendSellerWorkflowId = "suspend-seller"

type SuspendSellerWorkflowInput = {
  seller_id: string
  reason?: string
}

export const suspendSellerWorkflow = createWorkflow(
  suspendSellerWorkflowId,
  function (input: SuspendSellerWorkflowInput) {
    const { data: seller } = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "status", "rejected_at"],
      filters: { id: input.seller_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-seller" })

    const sellerData = transform({ seller }, ({ seller }) => seller[0])

    validateSuspendSellerStep({ seller: sellerData })

    const updateInput = transform({ input, sellerData }, ({ input, sellerData }) => ({
      selector: { id: input.seller_id },
      update: {
        status: SellerStatus.SUSPENDED,
        status_reason: input.reason ?? null,
        rejected_at: sellerData.rejected_at ?? new Date(),
      },
    }))

    updateSellersStep(updateInput)

    emitEventStep({
      eventName: SellerWorkflowEvents.SUSPENDED,
      data: { id: input.seller_id },
    })

    const sellerSuspended = createHook("sellerSuspended", {
      seller_id: input.seller_id,
    })

    return new WorkflowResponse(void 0, { hooks: [sellerSuspended] })
  }
)
