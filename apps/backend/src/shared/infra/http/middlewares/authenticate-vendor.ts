import { NextFunction } from 'express'

import {
  AuthenticatedMedusaRequest,
  MedusaRequest,
  MedusaResponse,
  authenticate
} from '@medusajs/framework'

import { SELLER_MODULE } from '../../../../modules/seller'
import SellerModuleService from '../../../../modules/seller/service'

async function authenticateWithApiKey(
  req: MedusaRequest,
  res: MedusaResponse,
  next: NextFunction
) {
  const service = req.scope.resolve<SellerModuleService>(SELLER_MODULE)
  const token = req.headers.authorization?.split(' ')[1] || ''

  let normalizedToken = token
  if (!token.startsWith('ssk_')) {
    normalizedToken = Buffer.from(token, 'base64').toString('utf-8')
  }

  if (normalizedToken.endsWith(':')) {
    normalizedToken = normalizedToken.slice(0, -1)
  }

  const [api_key] = await service.listSellerApiKeys({
    token: service.calculateHash(normalizedToken)
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
