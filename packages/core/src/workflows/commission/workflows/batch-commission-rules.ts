import { BatchWorkflowInput, BatchWorkflowOutput } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateCommissionRuleDTO,
  UpdateCommissionRuleDTO,
  CommissionRuleDTO,
} from "@mercurjs/types"

import { createCommissionRulesStep } from "../steps/create-commission-rules"
import { updateCommissionRulesStep } from "../steps/update-commission-rules"
import { deleteCommissionRulesStep } from "../steps/delete-commission-rules"

export interface BatchCommissionRulesWorkflowInput
  extends BatchWorkflowInput<CreateCommissionRuleDTO, UpdateCommissionRuleDTO> {
  commission_rate_id: string
}

export interface BatchCommissionRulesWorkflowOutput
  extends BatchWorkflowOutput<CommissionRuleDTO> {}

export const batchCommissionRulesWorkflowId = "batch-commission-rules"

export const batchCommissionRulesWorkflow = createWorkflow(
  batchCommissionRulesWorkflowId,
  (
    input: WorkflowData<BatchCommissionRulesWorkflowInput>
  ): WorkflowResponse<BatchCommissionRulesWorkflowOutput> => {
    const createInput = transform({ input }, (data) => ({
      commission_rate_id: data.input.commission_rate_id,
      rules: data.input.create ?? [],
    }))

    const updateInput = transform({ input }, (data) => data.input.update ?? [])

    const deleteInput = transform({ input }, (data) => data.input.delete ?? [])

    const [created, updated, deleted] = parallelize(
      createCommissionRulesStep(createInput),
      updateCommissionRulesStep(updateInput),
      deleteCommissionRulesStep(deleteInput)
    )

    return new WorkflowResponse(
      transform({ created, updated, deleted }, (data) => data)
    )
  }
)
