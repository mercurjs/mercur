import { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import sellerCustomerGroup from '../../../links/seller-customer-group'

export async function validateCustomerGroupsOwnership(
  container: MedusaContainer,
  seller_id: string,
  group_ids: string[]
) {
  if (!group_ids.length) {
    return
  }

  const groups = [...new Set(group_ids)]
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: sellerCustomerGroup.entryPoint,
    fields: ['id'],
    filters: {
      seller_id,
      customer_group_id: groups
    }
  })

  if (data.length !== groups.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Some of the customer groups do not belong to the current seller!'
    )
  }
}
