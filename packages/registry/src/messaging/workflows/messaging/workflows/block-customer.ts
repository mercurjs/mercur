import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { blockCustomerStep } from "../steps/block-customer"
import { BlockCustomerInput } from "../../../modules/messaging/types/mutations"

export const blockCustomerWorkflow = createWorkflow(
  { name: "block-customer" },
  function (input: BlockCustomerInput) {
    const block = blockCustomerStep(input)
    return new WorkflowResponse(block)
  }
)
