import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteShippingProfileWorkflow,
  updateShippingProfilesWorkflow
} from '@medusajs/medusa/core-flows'

import { VendorUpdateShippingProfileType } from '../validators'

/**
 * @oas [get] /vendor/shipping-profiles/{id}
 * operationId: "VendorGetShippingProfile"
 * summary: "Get shipping profile"
 * description: "Retrieves a shipping profile by id."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the shipping profile
 *     schema:
 *       type: string
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
 *             shipping_profile:
 *               $ref: "#/components/schemas/VendorShippingProfile"
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

  const {
    data: [shipping_profile]
  } = await query.graph({
    entity: 'shipping_profile',
    fields: req.queryConfig.fields,
    filters: {
      id: req.params.id
    }
  })

  res.json({ shipping_profile })
}

/**
 * @oas [post] /vendor/shipping-profiles/{id}
 * operationId: "VendorUpdateShippingProfile"
 * summary: "Update a Shipping profile"
 * description: "Updates a Shipping profile."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the shipping profile
 *     schema:
 *       type: string
 *   - in: query
 *     name: fields
 *     description: The comma-separated fields to include in the response
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateShippingProfile"
 * responses:
 *   "200":
 *     description: OK
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
  req: AuthenticatedMedusaRequest<VendorUpdateShippingProfileType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await updateShippingProfilesWorkflow.run({
    container: req.scope,
    input: { selector: { id }, update: req.validatedBody }
  })

  const {
    data: [shipping_profile]
  } = await query.graph({
    entity: 'shipping_profile',
    fields: req.queryConfig.fields,
    filters: {
      id
    }
  })

  res.json({ shipping_profile })
}

/**
 * @oas [delete] /vendor/shipping-profiles/{id}
 * operationId: "VendorDeleteShippingProfileById"
 * summary: "Delete shipping profile"
 * description: "Deletes shipping profile by id for the authenticated vendor."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the shipping profile.
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
 *             id:
 *               type: string
 *               description: The ID of the deleted resource
 *             object:
 *               type: string
 *               description: The type of the object that was deleted
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted
 * tags:
 *   - Vendor Shipping Profiles
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  await deleteShippingProfileWorkflow.run({
    container: req.scope,
    input: { ids: [id] }
  })

  res.json({
    id,
    object: 'shipping_profile',
    deleted: true
  })
}
