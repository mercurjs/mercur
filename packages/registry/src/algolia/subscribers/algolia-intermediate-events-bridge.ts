import {
  MedusaContainer,
  SubscriberArgs,
  SubscriberConfig
} from '@medusajs/framework'
import { IEventBusModuleService } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { IntermediateEvents } from '../modules/algolia/types'

const CHANGE_ACTIONS = ['created', 'updated', 'deleted'] as const

const withChangeActions = (entityEvent: string): string[] =>
  CHANGE_ACTIONS.map((action) => `${entityEvent}.${action}`)

const mapToIntermediateEvent = (
  entityEvent: string,
  intermediateEvent: IntermediateEvents
): Record<string, IntermediateEvents> =>
  Object.fromEntries(
    withChangeActions(entityEvent).map((name) => [name, intermediateEvent])
  )

const INVENTORY_LEVEL_EVENTS = withChangeActions(
  `${Modules.INVENTORY}.inventory-level`
)

const INTERMEDIATE_EVENT_BY_SOURCE: Record<string, IntermediateEvents> = {
  ...mapToIntermediateEvent(
    `${Modules.INVENTORY}.inventory-item`,
    IntermediateEvents.INVENTORY_ITEM_CHANGED
  ),
  ...mapToIntermediateEvent(
    `${Modules.STOCK_LOCATION}.stock-location`,
    IntermediateEvents.STOCK_LOCATION_CHANGED
  ),
  ...mapToIntermediateEvent(
    `${Modules.FULFILLMENT}.fulfillment-set`,
    IntermediateEvents.FULFILLMENT_SET_CHANGED
  ),
  ...mapToIntermediateEvent(
    `${Modules.FULFILLMENT}.service-zone`,
    IntermediateEvents.SERVICE_ZONE_CHANGED
  ),
  ...mapToIntermediateEvent(
    `${Modules.FULFILLMENT}.shipping-option`,
    IntermediateEvents.SHIPPING_OPTION_CHANGED
  )
}

const toIds = (id: string | string[]): string[] =>
  (Array.isArray(id) ? id : [id]).filter((value): value is string =>
    Boolean(value)
  )

async function selectInventoryItemIds(
  container: MedusaContainer,
  inventoryLevelIds: string[]
): Promise<string[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: levels } = await query.graph({
    entity: 'inventory_level',
    fields: ['inventory_item_id'],
    filters: {
      id: inventoryLevelIds
    },
    withDeleted: true
  })

  return [
    ...new Set(
      levels
        .map((level) => level.inventory_item_id)
        .filter((id): id is string => Boolean(id))
    )
  ]
}

export default async function algoliaIntermediateEventsBridgeHandler({
  event,
  container
}: SubscriberArgs<{ id: string | string[] }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const eventBus = container.resolve<IEventBusModuleService>(Modules.EVENT_BUS)

  try {
    const ids = toIds(event.data.id)

    if (!ids.length) {
      return
    }

    if (INVENTORY_LEVEL_EVENTS.includes(event.name)) {
      const inventoryItemIds = await selectInventoryItemIds(container, ids)

      if (!inventoryItemIds.length) {
        return
      }

      await eventBus.emit({
        name: IntermediateEvents.INVENTORY_ITEM_CHANGED,
        data: { id: inventoryItemIds }
      })
      return
    }

    const intermediateEvent = INTERMEDIATE_EVENT_BY_SOURCE[event.name]

    if (!intermediateEvent) {
      return
    }

    await eventBus.emit(
      ids.map((id) => ({ name: intermediateEvent, data: { id } }))
    )
  } catch (error: unknown) {
    logger.error(
      `Algolia bridge: failed to forward event ${event.name}:`,
      error as Error
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    ...INVENTORY_LEVEL_EVENTS,
    ...Object.keys(INTERMEDIATE_EVENT_BY_SOURCE)
  ],
  context: {
    subscriberId: 'algolia-intermediate-events-bridge'
  }
}
