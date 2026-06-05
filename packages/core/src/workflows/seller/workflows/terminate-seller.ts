import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { SellerStatus } from "@mercurjs/types"

import { validateTerminateSellerStep, updateSellersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const terminateSellerWorkflowId = "terminate-seller"

type TerminateSellerWorkflowInput = {
  seller_id: string
  reason?: string
}

export const terminateSellerWorkflow = createWorkflow(
  terminateSellerWorkflowId,
  function (input: TerminateSellerWorkflowInput) {
    const { data: seller } = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "status"],
      filters: { id: input.seller_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-seller" })

    const sellerData = transform({ seller }, ({ seller }) => seller[0])

    validateTerminateSellerStep({ seller: sellerData })

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.seller_id },
      update: {
        status: SellerStatus.TERMINATED,
        status_reason: input.reason ?? null,
      },
    }))

    updateSellersStep(updateInput)

    emitEventStep({
      eventName: SellerWorkflowEvents.TERMINATED,
      data: { id: input.seller_id },
    })

    const sellerTerminated = createHook("sellerTerminated", {
      seller_id: input.seller_id,
    })

    return new WorkflowResponse(void 0, { hooks: [sellerTerminated] })
  }
)
