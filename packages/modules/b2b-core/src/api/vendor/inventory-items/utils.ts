import { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import sellerInventoryItem from '../../../links/seller-inventory-item'
import sellerStockLocation from '../../../links/seller-stock-location'

type BodyPayload = {
  create?: {
    inventory_item_id: string
    location_id: string
  }[]
  update?: {
    inventory_item_id: string
    location_id: string
  }[]
  delete?: string[]
}

export async function validateOwnership(
  container: MedusaContainer,
  seller_id: string,
  body: BodyPayload
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let inventory_item_ids: string[] = []
  let location_ids: string[] = []

  if (body.create) {
    inventory_item_ids.concat(body.create.map((v) => v.inventory_item_id))
    location_ids.concat(body.create.map((v) => v.location_id))
  }

  if (body.update) {
    inventory_item_ids.concat(body.update.map((v) => v.inventory_item_id))
    location_ids.concat(body.update.map((v) => v.location_id))
  }

  if (body.delete) {
    const { data: levels } = await query.graph({
      entity: 'inventory_level',
      fields: ['inventory_item_id', 'location_id'],
      filters: {
        id: body.delete
      }
    })

    inventory_item_ids.concat(levels.map((l) => l.inventory_item_id))
    location_ids.concat(levels.map((l) => l.location_id))
  }

  inventory_item_ids = [...new Set(inventory_item_ids)]
  location_ids = [...new Set(location_ids)]

  const { data: items } = await query.graph({
    entity: sellerInventoryItem.entryPoint,
    fields: ['id'],
    filters: {
      seller_id,
      inventory_item_id: inventory_item_ids
    }
  })

  const { data: locations } = await query.graph({
    entity: sellerStockLocation.entryPoint,
    fields: ['id'],
    filters: {
      seller_id,
      stock_location_id: location_ids
    }
  })

  if (
    locations.length !== location_ids.length ||
    items.length !== inventory_item_ids.length
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'Some of the entities do not belong to the current seller!'
    )
  }
}

export async function prepareBatchInventoryLevelDeletePayload(
  container: MedusaContainer,
  inventory_item_id: string,
  delete_ids?: string[]
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let ilev = delete_ids?.filter((id) => id.startsWith('ilev_')) || []
  const sloc = delete_ids?.filter((id) => id.startsWith('sloc_')) || []

  if (sloc.length) {
    const { data: levels } = await query.graph({
      entity: 'inventory_level',
      fields: ['id'],
      filters: {
        inventory_item_id,
        location_id: sloc
      }
    })

    ilev = ilev.concat(levels.map((level) => level.id))
  }

  return ilev
}
