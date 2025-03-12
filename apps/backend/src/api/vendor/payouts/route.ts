import sellerPayoutAccount from '#/links/seller-payout-account'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [sellerPayoutAccountRelation]
  } = await query.graph({
    entity: sellerPayoutAccount.entryPoint,
    fields: ['payout_account_id'],
    filters: req.filterableFields
  })

  if (!sellerPayoutAccountRelation) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Payout account is not connected to the seller'
    )
  }

  const { data: payouts, metadata } = await query.graph({
    entity: 'payout',
    fields: req.queryConfig.fields,
    filters: {
      payout_account_id: sellerPayoutAccountRelation.payout_account_id
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    payouts,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take
  })
}
