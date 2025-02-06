import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'

import { createSellerCreationRequestWorkflow } from '../../../workflows/requests/workflows'
import { VendorCreateSellerType } from './validators'

/**
 * @oas [post] /vendor/sellers
 * operationId: "VendorCreateSeller"
 * summary: "Create a Seller"
 * description: "Creates a request to create a new seller with an initial owner member."
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
 *             request:
 *               $ref: "#/components/schemas/VendorRequest"
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
  if (req.auth_context?.actor_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      'Request already authenticated as a seller.'
    )
  }

  const { member, ...sellerData } = req.validatedBody

  const { result: request } = await createSellerCreationRequestWorkflow.run({
    input: {
      data: {
        seller: sellerData,
        member,
        auth_identity_id: req.auth_context?.auth_identity_id
      },
      type: 'seller',
      submitter_id: 'unknown',
    },
    container: req.scope
  })

  res.status(201).json({ request })
}
