import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { resolveConnector } from "../../../utils/payout-module"

export type SetCheckpointsStepInput = { key: string; value: string | null }[]

export const setCheckpointsStepId = "set-stripe-connector-checkpoints"

export const setCheckpointsStep = createStep(
  setCheckpointsStepId,
  async (input: SetCheckpointsStepInput, { container }) => {
    const connector = resolveConnector(container)
    const previous: SetCheckpointsStepInput = []

    for (const checkpoint of input) {
      const current = await connector.getCheckpoint(checkpoint.key)
      if (current === checkpoint.value) {
        continue
      }
      previous.push({ key: checkpoint.key, value: current })
      await connector.setCheckpoint(checkpoint.key, checkpoint.value)
    }

    return new StepResponse(void 0, previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }
    const connector = resolveConnector(container)
    for (const checkpoint of previous) {
      await connector.setCheckpoint(checkpoint.key, checkpoint.value)
    }
  }
)
