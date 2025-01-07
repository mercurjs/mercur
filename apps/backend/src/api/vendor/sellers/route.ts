import { MedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  AuthenticationInput,
  IAuthModuleService
} from '@medusajs/framework/types'
import { Modules } from '@medusajs/framework/utils'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

import { createSellerWorkflow } from '../../../workflows/seller/workflows'
import { VendorCreateSellerType } from './validators'

/**
 * @oas [post] /vendor/sellers
 * operationId: "VendorCreateSeller"
 * summary: "Create a Seller"
 * description: "Creates a new seller with an initial owner member."
 * x-authenticated: false
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateSeller"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               $ref: "#/components/schemas/VendorSeller"
 * tags:
 *   - Seller
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: MedusaRequest<VendorCreateSellerType>,
  res: MedusaResponse
) => {
  const service: IAuthModuleService = req.scope.resolve(Modules.AUTH)

  const registerVendorPayload = {
    email: req.validatedBody.email,
    password: req.validatedBody.password
  }

  const authData = {
    url: req.url,
    headers: req.headers,
    query: req.query,
    body: registerVendorPayload,
    protocol: req.protocol
  } as unknown as AuthenticationInput

  const { success, error, authIdentity } = await service.register(
    'emailpass',
    authData
  )

  if (error) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Error registering seller: ${error}`
    )
  }

  if (success && authIdentity) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { member, ...sellerData } = req.validatedBody

    const { result: created } = await createSellerWorkflow(req.scope).run({
      input: {
        seller: sellerData,
        member,
        auth_identity_id: authIdentity.id
      }
    })

    const {
      data: [seller]
    } = await query.graph(
      {
        entity: 'seller',
        fields: req.remoteQueryConfig.fields,
        filters: { id: created.id }
      },
      { throwIfKeyNotFound: true }
    )

    res.status(201).json({ seller })
  }
}
