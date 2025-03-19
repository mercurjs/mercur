import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  container
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { fetchSellerByAuthContext } from '../../../../../shared/infra/http/utils'
import { createSellerApiKeyWorkflow } from '../../../../../workflows/seller/workflows'
import { VendorCreateSellerApiKeyType } from '../../validators'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: api_keys, metadata } = await query.graph({
    entity: 'seller_api_key',
    fields: [
      'id',
      'title',
      'redacted',
      'created_by',
      'revoked_at',
      'revoked_by'
    ],
    filters: req.filterableFields
  })

  res.json({
    api_keys,
    count: metadata?.count,
    skip: metadata?.skip,
    take: metadata?.take
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateSellerApiKeyType>,
  res: MedusaResponse
) => {
  const seller = await fetchSellerByAuthContext(req.auth_context, req.scope)

  const { result: api_key } = await createSellerApiKeyWorkflow.run({
    container: req.scope,
    input: {
      ...req.validatedBody,
      seller_id: seller.id,
      created_by: req.auth_context.actor_id
    }
  })

  res.status(201).json({ api_key })
}
