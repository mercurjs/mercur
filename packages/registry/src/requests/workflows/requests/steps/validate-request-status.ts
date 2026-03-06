import { createStep } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

import { RequestStatus } from "../../../types"

type ValidateRequestStatusStepInput = {
  alias: string
  entity_id: string
  expected_status: RequestStatus | RequestStatus[]
}

export const validateRequestStatusStep = createStep(
  "validate-request-status",
  async (input: ValidateRequestStatusStepInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [entity],
    } = await query.graph({
      entity: input.alias,
      fields: ["id", "custom_fields.*"],
      filters: { id: input.entity_id },
    })

    if (!entity) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Request not found")
    }

    const status = (entity as any).custom_fields?.request_status

    const expected = Array.isArray(input.expected_status)
      ? input.expected_status
      : [input.expected_status]

    if (!expected.includes(status)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Request status must be ${expected.join(" or ")}, but is ${status}`
      )
    }
  }
)
