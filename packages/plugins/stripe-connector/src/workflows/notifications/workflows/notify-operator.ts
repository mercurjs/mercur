import { WorkflowResponse, createWorkflow, transform, when } from "@medusajs/framework/workflows-sdk"

import { sendOperatorEmailsStep, setCheckpointsStep } from "../../common/steps"
import { ENDPOINT_DOWN_CHECKPOINT, postOperatorNotificationStep, resolveEndpointDownMailStep } from "../steps"

export type NotifyOperatorWorkflowInput = {
  type: string
  payload: Record<string, unknown>
}

export const notifyOperatorWorkflowId = "notify-stripe-operator"

/** Sends the operator a notification, and mails the technical contact when the endpoint stays down. */
export const notifyOperatorWorkflow = createWorkflow(
  notifyOperatorWorkflowId,
  function (input: NotifyOperatorWorkflowInput) {
    const posted = postOperatorNotificationStep(input)

    const mail = resolveEndpointDownMailStep(
      transform({ posted }, ({ posted }) => ({
        down: !!posted.notification && !posted.delivered,
        error: posted.error,
      }))
    )
    const sent = sendOperatorEmailsStep(mail)

    when("endpoint-down-mailed", { sent }, ({ sent }) => sent > 0).then(() => {
      setCheckpointsStep(
        transform({ sent }, () => [{ key: ENDPOINT_DOWN_CHECKPOINT, value: new Date().toISOString() }])
      )
    })

    return new WorkflowResponse(posted.notification)
  }
)
