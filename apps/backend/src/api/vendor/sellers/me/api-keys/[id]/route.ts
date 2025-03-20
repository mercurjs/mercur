import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  container
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { revokeSellerApiKeyWorkflow } from '../../../../../../workflows/seller/workflows'

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [api_key]
  } = await query.graph({
    entity: 'seller_api_key',
    fields: [
      'id',
      'title',
      'redacted',
      'created_by',
      'revoked_at',
      'revoked_by'
    ],
    filters: { id: req.params.id }
  })

  res.json({ api_key })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  await revokeSellerApiKeyWorkflow.run({
    container: req.scope,
    input: {
      id: req.params.id,
      revoked_by: req.auth_context.actor_id
    }
  })

  const {
    data: [api_key]
  } = await query.graph({
    entity: 'seller_api_key',
    fields: [
      'id',
      'title',
      'redacted',
      'created_by',
      'revoked_at',
      'revoked_by'
    ],
    filters: { id: req.params.id }
  })

  res.json({ api_key })
}
