import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { SellerStatus } from "@mercurjs/types"

import { validateUnterminateSellerStep, updateSellersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const unterminateSellerWorkflowId = "unterminate-seller"

type UnterminateSellerWorkflowInput = {
  seller_id: string
}

export const unterminateSellerWorkflow = createWorkflow(
  unterminateSellerWorkflowId,
  function (input: UnterminateSellerWorkflowInput) {
    const { data: seller } = useQueryGraphStep({
      entity: "seller",
      fields: ["id", "status"],
      filters: { id: input.seller_id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-seller" })

    const sellerData = transform({ seller }, ({ seller }) => seller[0])

    validateUnterminateSellerStep({ seller: sellerData })

    const updateInput = transform({ input }, ({ input }) => ({
      selector: { id: input.seller_id },
      update: {
        status: SellerStatus.SUSPENDED,
        status_reason: null,
      },
    }))

    updateSellersStep(updateInput)

    emitEventStep({
      eventName: SellerWorkflowEvents.UNTERMINATED,
      data: { id: input.seller_id },
    })

    const sellerUnterminated = createHook("sellerUnterminated", {
      seller_id: input.seller_id,
    })

    return new WorkflowResponse(void 0, { hooks: [sellerUnterminated] })
  }
)
