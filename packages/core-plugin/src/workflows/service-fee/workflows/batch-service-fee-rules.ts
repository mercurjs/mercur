import {
  BatchWorkflowInput,
  BatchWorkflowOutput,
} from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  parallelize,
  transform,
} from "@medusajs/framework/workflows-sdk"
import {
  CreateServiceFeeRuleDTO,
  UpdateServiceFeeRuleDTO,
  ServiceFeeRuleDTO,
} from "@mercurjs/types"

import { createServiceFeeRulesStep } from "../steps/create-service-fee-rules"
import { updateServiceFeeRulesStep } from "../steps/update-service-fee-rules"
import { deleteServiceFeeRulesStep } from "../steps/delete-service-fee-rules"

export interface BatchServiceFeeRulesWorkflowInput
  extends BatchWorkflowInput<
    CreateServiceFeeRuleDTO,
    UpdateServiceFeeRuleDTO
  > {
  service_fee_id: string
}

export interface BatchServiceFeeRulesWorkflowOutput
  extends BatchWorkflowOutput<ServiceFeeRuleDTO> {}

export const batchServiceFeeRulesWorkflowId = "batch-service-fee-rules"

export const batchServiceFeeRulesWorkflow = createWorkflow(
  batchServiceFeeRulesWorkflowId,
  (
    input: WorkflowData<BatchServiceFeeRulesWorkflowInput>
  ): WorkflowResponse<BatchServiceFeeRulesWorkflowOutput> => {
    const createInput = transform({ input }, (data) => ({
      service_fee_id: data.input.service_fee_id,
      rules: data.input.create ?? [],
    }))

    const updateInput = transform(
      { input },
      (data) => data.input.update ?? []
    )
    const deleteInput = transform(
      { input },
      (data) => data.input.delete ?? []
    )

    const [created, updated, deleted] = parallelize(
      createServiceFeeRulesStep(createInput),
      updateServiceFeeRulesStep(updateInput),
      deleteServiceFeeRulesStep(deleteInput)
    )

    return new WorkflowResponse(
      transform({ created, updated, deleted }, (data) => data)
    )
  }
)
