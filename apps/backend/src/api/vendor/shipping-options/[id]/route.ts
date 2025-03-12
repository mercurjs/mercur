import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import {
  deleteShippingOptionsWorkflow,
  updateShippingOptionsWorkflow
} from '@medusajs/medusa/core-flows'

import { VendorUpdateShippingOptionType } from '../validators'

/**
 * @oas [get] /vendor/shipping-options/{id}
 * operationId: "VendorGetShippingOptionById"
 * summary: "Get a Shipping Option"
 * description: "Retrieves a Shipping Option by its ID."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Shipping Option.
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
 *             shipping_option:
 *               $ref: "#/components/schemas/VendorShippingOption"
 * tags:
 *   - Shipping Option
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
    data: [shippingOption]
  } = await query.graph(
    {
      entity: 'shipping_option',
      fields: req.queryConfig.fields,
      filters: { id: req.params.id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ shipping_option: shippingOption })
}

/**
 * @oas [post] /vendor/shipping-options/{id}
 * operationId: "VendorUpdateShippingOptionById"
 * summary: "Update a Shipping Option"
 * description: "Updates a Shipping Option."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Shipping Option.
 *     schema:
 *       type: string
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/VendorUpdateShippingOption"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             shipping_option:
 *               $ref: "#/components/schemas/VendorShippingOption"
 * tags:
 *   - Shipping Option
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateShippingOptionType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  await updateShippingOptionsWorkflow(req.scope).run({
    input: [{ id: req.params.option_id, ...req.validatedBody }]
  })

  const {
    data: [shippingOption]
  } = await query.graph(
    {
      entity: 'shipping_option',
      fields: req.queryConfig.fields,
      filters: { id: req.params.id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ shipping_option: shippingOption })
}

/**
 * @oas [delete] /vendor/shipping-options/{id}
 * operationId: "VendorDeleteShippingOptionById"
 * summary: "Delete a Shipping Option"
 * description: "Deletes a Shipping Option."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Shipping Option.
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
 *               description: The ID of the deleted Shipping Option.
 *             object:
 *               type: string
 *               description: The type of the object that was deleted.
 *               default: shipping_option
 *             deleted:
 *               type: boolean
 *               description: Whether or not the items were deleted.
 *               default: true
 * tags:
 *   - Shipping Option
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { option_id } = req.params
  await deleteShippingOptionsWorkflow(req.scope).run({
    input: {
      ids: [option_id]
    }
  })

  res.json({ id: option_id, object: 'shipping_option', deleted: true })
}
