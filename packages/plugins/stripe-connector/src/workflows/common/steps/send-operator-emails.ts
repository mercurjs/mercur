import { CreateNotificationDTO, INotificationModuleService } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export const sendOperatorEmailsStepId = "send-stripe-operator-emails"

/**
 * Operator mail is best effort: a project without an email notification
 * provider still runs the job. Responds with the number of mails sent.
 */
export const sendOperatorEmailsStep = createStep(
  sendOperatorEmailsStepId,
  async (notifications: CreateNotificationDTO[], { container }) => {
    if (!notifications.length) {
      return new StepResponse(0)
    }
    try {
      await container.resolve<INotificationModuleService>(Modules.NOTIFICATION).createNotifications(notifications)
      return new StepResponse(notifications.length)
    } catch (error) {
      container
        .resolve(ContainerRegistrationKeys.LOGGER)
        .warn(`Stripe connector could not mail the operator: ${(error as Error).message}`)
      return new StepResponse(0)
    }
  }
)
