import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import sellerPayoutAccountLink from '../../../links/seller-payout-account'

export const refetchPayoutAccount = async (
  container: MedusaContainer,
  fields: string[],
  filters: Record<string, unknown>
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerPayoutAccount]
  } = await query.graph(
    {
      entity: sellerPayoutAccountLink.entryPoint,
      fields,
      filters
    },
    { throwIfKeyNotFound: true }
  )

  return sellerPayoutAccount
}
