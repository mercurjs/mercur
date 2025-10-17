import { NextFunction } from 'express'

import {
  AuthType,
  ConfigModule,
  MedusaRequest,
  MedusaResponse,
  getAuthContextFromJwtToken
} from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

export function checkSellerApproved(authTypes: AuthType[]) {
  return async (
    req: MedusaRequest,
    res: MedusaResponse,
    next: NextFunction
  ) => {
    const {
      projectConfig: { http }
    } = req.scope.resolve<ConfigModule>(ContainerRegistrationKeys.CONFIG_MODULE)

    const ctx = getAuthContextFromJwtToken(
      req.headers.authorization,
      http.jwtSecret!,
      authTypes,
      ['seller']
    )

    if (!ctx) {
      return res.status(401).json({
        message: 'Unauthorized'
      })
    }

    if (ctx.actor_id) {
      return next()
    }

    res.status(403).json({
      message: 'Seller is not active'
    })
  }
}
