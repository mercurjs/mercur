import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  MedusaError
} from '@medusajs/framework/utils'

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
 *   - Vendor Sellers
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
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { member, ...sellerData } = req.validatedBody

  const {
    data: [identity]
  } = await query.graph({
    entity: 'provider_identity',
    fields: ['id', 'entity_id'],
    filters: {
      auth_identity_id: req.auth_context?.auth_identity_id
    }
  })

  const {
    data: [existingRequest]
  } = await query.graph({
    entity: 'request',
    fields: ['id'],
    filters: {
      submitter_id: identity.id,
      type: 'seller'
    }
  })

  if (existingRequest) {
    throw new MedusaError(MedusaError.Types.CONFLICT, 'Request already exists!')
  }

  const {
    result: [request]
  } = await createSellerCreationRequestWorkflow.run({
    input: {
      data: {
        seller: { ...sellerData, email: sellerData.email || member.email },
        member,
        auth_identity_id: req.auth_context?.auth_identity_id,
        provider_identity_id: identity.entity_id
      },
      type: 'seller',
      submitter_id: identity.id
    },
    container: req.scope
  })

  res.status(201).json({ request })
}
