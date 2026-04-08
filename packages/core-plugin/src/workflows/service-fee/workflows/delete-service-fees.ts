import {
  createHook,
  createWorkflow,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { deleteServiceFeesStep } from "../steps/delete-service-fees"

export type DeleteServiceFeesWorkflowInput = {
  ids: string[]
}

export const deleteServiceFeesWorkflowId = "delete-service-fees"

export const deleteServiceFeesWorkflow = createWorkflow(
  deleteServiceFeesWorkflowId,
  (input: WorkflowData<DeleteServiceFeesWorkflowInput>) => {
    const deletedServiceFees = deleteServiceFeesStep(input.ids)

    const serviceFeesDeleted = createHook("serviceFeesDeleted", {
      ids: input.ids,
    })

    return new WorkflowResponse(deletedServiceFees, {
      hooks: [serviceFeesDeleted],
    })
  }
)
