import { MedusaRequest, MedusaResponse } from '@medusajs/framework/http'
import {
  AuthenticationInput,
  ConfigModule,
  IAuthModuleService
} from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules
} from '@medusajs/framework/utils'
import { generateJwtTokenForAuthIdentity } from '@medusajs/medusa/api/auth/utils/generate-jwt-token'

import { SELLER_MODULE } from '../../../../modules/seller/index'
import SellerModuleService from '../../../../modules/seller/service'
import { SellerStatus } from '../../../../modules/seller/types/common'

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const { actor_type, auth_provider } = req.params
  const config: ConfigModule = req.scope.resolve(
    ContainerRegistrationKeys.CONFIG_MODULE
  )

  const service: IAuthModuleService = req.scope.resolve(Modules.AUTH)

  if (actor_type === 'seller') {
    const sellerModuleService: SellerModuleService =
      req.scope.resolve<SellerModuleService>(SELLER_MODULE)

    const sellers = await sellerModuleService.listSellers({
      email: (req.body as { email: string; password: string }).email
    })

    if (!sellers.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, 'Seller not found')
    }

    if (!(sellers[0].status === SellerStatus.APPROVED)) {
      throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Unauthorized')
    }
  }

  const authData = {
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: req.body,
    protocol: req.protocol
  } as AuthenticationInput

  const { success, error, authIdentity, location } = await service.authenticate(
    auth_provider,
    authData
  )

  if (location) {
    return res.status(200).json({ location })
  }

  if (success && authIdentity) {
    const { http } = config.projectConfig

    const token = generateJwtTokenForAuthIdentity(
      {
        authIdentity,
        actorType: actor_type
      },
      {
        secret: http.jwtSecret,
        expiresIn: http.jwtExpiresIn
      }
    )

    return res.status(200).json({ token })
  }

  throw new MedusaError(
    MedusaError.Types.UNAUTHORIZED,
    error || 'Authentication failed'
  )
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  await GET(req, res)
}
