import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { SellerStatus } from "@mercurjs/types"

import { validateUnsuspendSellerStep, updateSellersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const unsuspendSellerWorkflowId = "unsuspend-seller"

type UnsuspendSellerWorkflowInput = {
  seller_id: string
}

export const unsuspendSellerWorkflow = createWorkflow(
  unsuspendSellerWorkflowId,
  function (input: UnsuspendSellerWorkflowInput) {
    const { data: seller } = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "status"],
      filters: { id: input.seller_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-seller" })

    const sellerData = transform({ seller }, ({ seller }) => seller[0])

    validateUnsuspendSellerStep({ seller: sellerData })

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.seller_id },
      update: {
        status: SellerStatus.OPEN,
        status_reason: null,
      },
    }))

    updateSellersStep(updateInput)

    emitEventStep({
      eventName: SellerWorkflowEvents.UNSUSPENDED,
      data: { id: input.seller_id },
    })

    const sellerUnsuspended = createHook("sellerUnsuspended", {
      seller_id: input.seller_id,
    })

    return new WorkflowResponse(void 0, { hooks: [sellerUnsuspended] })
  }
)
