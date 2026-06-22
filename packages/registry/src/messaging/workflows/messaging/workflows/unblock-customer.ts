import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { unblockCustomerStep } from "../steps/unblock-customer"
import { UnblockCustomerInput } from "../../../modules/messaging/types/mutations"

export const unblockCustomerWorkflow = createWorkflow(
  { name: "unblock-customer" },
  function (input: UnblockCustomerInput) {
    const result = unblockCustomerStep(input)
    return new WorkflowResponse(result)
  }
)
