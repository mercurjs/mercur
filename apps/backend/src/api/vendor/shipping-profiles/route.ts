import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { createShippingProfilesWorkflow } from '@medusajs/medusa/core-flows'

import { SELLER_MODULE } from '@mercurjs/seller'

import sellerShippingProfile from '../../../links/seller-shipping-profile'
import { fetchSellerByAuthActorId } from '../../../shared/infra/http/utils'
import { VendorCreateShippingProfileType } from './validators'

/**
 * @oas [post] /vendor/shipping-profiles
 * operationId: "VendorCreateShippingProfile"
 * summary: "Create a Shipping profile"
 * description: "Creates a Shipping profile."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorCreateShippingProfile"
 * responses:
 *   "201":
 *     description: Created
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             shipping_profile:
 *               $ref: "#/components/schemas/VendorShippingProfile"
 * tags:
 *   - Vendor Shipping Profiles
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateShippingProfileType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  const { result } = await createShippingProfilesWorkflow.run({
    container: req.scope,
    input: {
      data: [
        {
          type: req.validatedBody.type,
          name: `${seller.id}:${req.validatedBody.name}`
        }
      ]
    }
  })

  const {
    data: [shipping_profile]
  } = await query.graph({
    entity: 'shipping_profile',
    fields: req.queryConfig.fields,
    filters: {
      id: result[0].id
    }
  })

  await link.create({
    [SELLER_MODULE]: {
      seller_id: seller.id
    },
    [Modules.FULFILLMENT]: {
      shipping_profile_id: shipping_profile.id
    }
  })

  res.status(201).json({ shipping_profile })
}

/**
 * @oas [get] /vendor/shipping-profiles
 * operationId: "VendorListShippingProfiles"
 * summary: "List shipping profiles"
 * description: "Retrieves a list of shipping profiles."
 * x-authenticated: true
 * parameters:
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
 *     schema:
 *       type: string
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             shipping_profiles:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/VendorShippingProfile"
 * tags:
 *   - Vendor Shipping Profiles
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: shipping_profiles, metadata } = await query.graph({
    entity: sellerShippingProfile.entryPoint,
    fields: req.queryConfig.fields.map((field) => `shipping_profile.${field}`),
    filters: {
      ...req.filterableFields,
      deleted_at: {
        $eq: null
      }
    },
    pagination: req.queryConfig.pagination
  })

  res.json({
    shipping_profiles,
    count: metadata?.count,
    offset: metadata?.skip,
    limit: metadata?.take
  })
}
