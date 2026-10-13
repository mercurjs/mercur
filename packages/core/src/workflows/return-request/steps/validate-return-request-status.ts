import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { ReturnRequestStatus } from "@mercurjs/types"

export const validateReturnRequestStatusStepId =
  "rr-validate-return-request-status"

type ValidateReturnRequestStatusStepInput = {
  request: { id: string; status: ReturnRequestStatus | string }
  expected: ReturnRequestStatus[]
}

export const validateReturnRequestStatusStep = createStep(
  validateReturnRequestStatusStepId,
  async ({ request, expected }: ValidateReturnRequestStatusStepInput) => {
    if (!expected.includes(request.status as ReturnRequestStatus)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Return request '${request.id}' has status '${request.status}', expected one of: ${expected.join(", ")}.`
      )
    }

    return new StepResponse(void 0)
  }
)
