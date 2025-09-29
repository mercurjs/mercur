import { Modules } from '@medusajs/framework/utils'
import { StepResponse, createStep } from '@medusajs/framework/workflows-sdk'

type Input = {
  name: string
  data: Record<string, any>
}

export const emitMultipleEventsStep = createStep(
  'emit-multiple-events',
  async (input: Input[], { container }) => {
    const event_bus = container.resolve(Modules.EVENT_BUS)

    const events = input.map((event) => event_bus.emit(event))
    await Promise.all(events)

    return new StepResponse()
  }
)
