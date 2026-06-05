import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/core-flows"

import { validateRemoveSellerMemberStep, deleteSellerMemberStep } from "../steps"
import { SellerMemberWorkflowEvents } from "../../events"

export const removeSellerMemberWorkflowId = "remove-seller-member"

type RemoveSellerMemberWorkflowInput = {
  seller_member_id: string
  seller_id: string
}

export const removeSellerMemberWorkflow = createWorkflow(
  removeSellerMemberWorkflowId,
  function (input: RemoveSellerMemberWorkflowInput) {
    validateRemoveSellerMemberStep({ seller_member_id: input.seller_member_id })

    deleteSellerMemberStep(input.seller_member_id)

    emitEventStep({
      eventName: SellerMemberWorkflowEvents.DELETED,
      data: {
        seller_id: input.seller_id,
        seller_member_id: input.seller_member_id,
      },
    })

    return new WorkflowResponse(void 0)
  }
)
