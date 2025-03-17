import { NextFunction } from 'express'

import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
  authenticate
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

async function authenticateWithApiKey(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) {
  const token = req.headers.authorization?.split(' ')[1]

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [api_key]
  } = await query.graph({
    entity: 'seller_api_key',
    fields: ['*'],
    filters: {
      token
    }
  })

  if (!api_key || api_key.revoked_at !== null || api_key.deleted_at !== null) {
    return res.status(401).json({ message: 'Invalid api key!' })
  }

  const req_ = req as AuthenticatedMedusaRequest
  req_.auth_context = {
    actor_id: api_key.id,
    actor_type: 'seller-api-key',
    auth_identity_id: '',
    app_metadata: {}
  }

  return next()
}

export function authenticateVendor(
  options: { allowUnauthenticated?: boolean; allowUnregistered?: boolean } = {}
) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const authorization = req.headers.authorization

    if (authorization && authorization.toLowerCase().startsWith('basic')) {
      return authenticateWithApiKey(req, res, next)
    }

    return authenticate('seller', ['bearer', 'session'], options)(
      req,
      res,
      next
    )
  }
}
