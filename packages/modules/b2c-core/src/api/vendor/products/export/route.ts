import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'

import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils'
import { exportSellerProductsWorkflow } from '../../../../workflows/seller/workflows'

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result: fileData } = await exportSellerProductsWorkflow.run({
    container: req.scope,
    input: seller.id
  })

  res.json({
    url: fileData.url
  })
}
