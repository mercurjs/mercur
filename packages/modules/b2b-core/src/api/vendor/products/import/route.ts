import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'

import { fetchSellerByAuthActorId } from '../../../../shared/infra/http/utils'
import { importSellerProductsWorkflow } from '../../../../workflows/seller/workflows'

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const input = (req as any).file

  if (!input) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'No file was uploaded for importing'
    )
  }

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result: products } = await importSellerProductsWorkflow.run({
    container: req.scope,
    input: {
      file_content: input.buffer.toString('utf-8'),
      seller_id: seller.id,
      submitter_id: req.auth_context.actor_id
    }
  })

  res.status(201).json({ products })
}
