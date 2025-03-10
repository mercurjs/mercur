import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerInventoryItem from '../../../links/seller-inventory-item'
import { VendorGetReservationParamsType } from './validators'

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetReservationParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: inventory_items } = await query.graph({
    entity: sellerInventoryItem.entryPoint,
    fields: ['inventory_item_id'],
    filters: req.filterableFields
  })

  const { data: reservations, metadata } = await query.graph({
    entity: 'reservation',
    fields: req.remoteQueryConfig.fields,
    filters: {
      inventory_item_id: inventory_items.map((item) => item.inventory_item_id)
    },
    pagination: req.remoteQueryConfig.pagination
  })

  res.json({
    reservations,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
