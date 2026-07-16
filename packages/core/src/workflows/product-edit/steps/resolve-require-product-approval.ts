import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

import { resolveRequireProductApproval } from "../../../utils/require-product-approval"

export const resolveRequireProductApprovalStepId =
  "pc-resolve-require-product-approval"

export const resolveRequireProductApprovalStep = createStep(
  resolveRequireProductApprovalStepId,
  async (_, { container }) => {
    return new StepResponse(await resolveRequireProductApproval(container))
  }
)
