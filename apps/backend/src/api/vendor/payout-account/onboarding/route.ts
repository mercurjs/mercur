import { fetchSellerByAuthActorId } from '#/shared/infra/http/utils'
import { createOnboardingForSellerWorkflow } from '#/workflows/seller/workflows'

import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { VendorCreateOnboardingType } from '../validators'

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateOnboardingType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result } = await createOnboardingForSellerWorkflow(req.scope).run({
    context: { transactionId: seller.id },
    input: {
      seller_id: seller.id,
      context: req.validatedBody.context ?? {}
    }
  })

  const {
    data: [payoutAccount]
  } = await query.graph(
    {
      entity: 'payout_account',
      fields: req.remoteQueryConfig.fields,
      filters: {
        onboarding_id: result.id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.status(200).json({
    payout_account: payoutAccount
  })
}
