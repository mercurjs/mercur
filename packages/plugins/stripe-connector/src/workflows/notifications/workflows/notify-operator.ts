import { WorkflowResponse, createWorkflow, when } from "@medusajs/framework/workflows-sdk"

import { mailNotificationEndpointDownStep, postOperatorNotificationStep } from "../steps"

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

    when("operator-endpoint-down", { posted }, ({ posted }) => !!posted.notification && !posted.delivered).then(() => {
      mailNotificationEndpointDownStep({ error: posted.error })
    })

    return new WorkflowResponse(posted.notification)
  }
)
