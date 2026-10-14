import {
  IEventBusModuleService,
  MedusaContainer,
} from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Call before triggering the action: workflow events are released when the
// workflow ends, which can be before the HTTP response arrives.
export const waitForEvent = (
  container: MedusaContainer,
  eventName: string,
  timeout = 10000
): Promise<unknown> => {
  const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)
  // The local event bus can only detach a wrapped listener by subscriber id.
  const context = { subscriberId: `wait-for-${eventName}-${Date.now()}` }

  return new Promise((resolve, reject) => {
    const subscriber = async ({ data }: { data: unknown }) => {
      clearTimeout(timer)
      eventBus.unsubscribe(eventName, subscriber, context)
      resolve(data)
    }

    const timer = setTimeout(() => {
      eventBus.unsubscribe(eventName, subscriber, context)
      reject(new Error(`${eventName} was not emitted within ${timeout}ms`))
    }, timeout)

    eventBus.subscribe(eventName, subscriber, context)
  })
}
