import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import { syncStripeAccountWorkflow } from '../../../../workflows/seller/workflows'

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [member]
  } = await query.graph({
    entity: 'member',
    fields: ['seller.payout_account.id'],
    filters: {
      id: req.auth_context.actor_id
    }
  })

  if (!member.seller.payout_account) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      'Payout account not found'
    )
  }

  const { result: payout_account } = await syncStripeAccountWorkflow.run({
    container: req.scope,
    input: member.seller.payout_account.id
  })

  return res.json({ payout_account })
}
