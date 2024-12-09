import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
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
 * x-authenticated: true
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
  req: AuthenticatedMedusaRequest<VendorCreateSellerType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Request already authenticated as a seller.'
    )
  }

  const { member, ...sellerData } = req.validatedBody

  const { result: created } = await createSellerWorkflow(req.scope).run({
    input: {
      seller: sellerData,
      member,
      auth_identity_id: req.auth_context?.auth_identity_id
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
