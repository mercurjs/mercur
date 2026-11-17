import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { VariantAttributeBatchInput } from "@mercurjs/types"

import { updateVariantAttributesWorkflow } from "../../product-attribute/workflows/update-variant-attributes"

export type ApplyVariantAttributeChangeActionsWorkflowInput = {
  batches: VariantAttributeBatchInput[]
}

export const applyVariantAttributeChangeActionsWorkflowId =
  "apply-variant-attribute-change-actions"

// One confirmed change may touch several variants, and the batch engine is
// scoped to a single variant, so the batches run sequentially inside a step.
const runVariantAttributeBatchesStep = createStep(
  "pc-run-variant-attribute-batches",
  async (batches: VariantAttributeBatchInput[], { container }) => {
    for (const batch of batches ?? []) {
      await updateVariantAttributesWorkflow(container).run({ input: batch })
    }
    return new StepResponse(void 0)
  },
)

export const applyVariantAttributeChangeActionsWorkflow = createWorkflow(
  applyVariantAttributeChangeActionsWorkflowId,
  function (input: ApplyVariantAttributeChangeActionsWorkflowInput) {
    runVariantAttributeBatchesStep(input.batches)
    return new WorkflowResponse(void 0)
  },
)
