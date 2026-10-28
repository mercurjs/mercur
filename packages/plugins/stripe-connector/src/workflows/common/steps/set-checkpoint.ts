import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export const setCheckpointStepId = "set-stripe-connector-checkpoint"

/** Moves a job's checkpoint forward; a null value leaves it where it is. */
export const setCheckpointStep = createStep(
  setCheckpointStepId,
  async (input: { key: string; value: string | null }, { container }) => {
    const connector = resolveConnector(container)
    const previous = await connector.getCheckpoint(input.key)
    if (!input.value || input.value === previous) {
      return new StepResponse(previous, null)
    }
    await connector.setCheckpoint(input.key, input.value)
    return new StepResponse(input.value, { key: input.key, value: previous })
  },
  async (previous, { container }) => {
    if (!previous) return
    await resolveConnector(container).setCheckpoint(previous.key, previous.value)
  }
)
