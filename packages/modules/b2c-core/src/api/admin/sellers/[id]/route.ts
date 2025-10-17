import { AuthenticatedMedusaRequest, MedusaResponse } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import { updateSellerWorkflow } from '../../../../workflows/seller/workflows'
import { AdminUpdateSellerType } from '../validators'

/**
 * @oas [get] /admin/sellers/{id}
 * operationId: "AdminGetSeller"
 * summary: "Get Seller"
 * description: "Retrieves a specific seller by its ID."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the seller to retrieve.
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               $ref: "#/components/schemas/AdminSeller"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Seller not found"
 * tags:
 *   - Admin Sellers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [seller]
  } = await query.graph(
    {
      entity: 'seller',
      fields: req.queryConfig.fields,
      filters: {
        id: req.params.id
      }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({
    seller
  })
}

/**
 * @oas [post] /admin/sellers/{id}
 * operationId: "AdminUpdateSeller"
 * summary: "Update Seller"
 * description: "Updates an existing seller with the specified properties."
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     required: true
 *     schema:
 *       type: string
 *     description: The ID of the seller to update.
 * requestBody:
 *   required: true
 *   content:
 *     application/json:
 *       schema:
 *         type: object
 *         properties:
 *           name:
 *             type: string
 *             minLength: 4
 *             description: The name of the seller.
 *           description:
 *             type: string
 *             description: A description of the seller.
 *           photo:
 *             type: string
 *             description: URL to the seller's photo.
 *           email:
 *             type: string
 *             format: email
 *             description: Store contact email.
 *           phone:
 *             type: string
 *             description: Store contact phone.
 *           address_line:
 *             type: string
 *             description: Seller address line.
 *           city:
 *             type: string
 *             description: Seller city.
 *           state:
 *             type: string
 *             description: Seller state.
 *           postal_code:
 *             type: string
 *             description: Seller postal code.
 *           country_code:
 *             type: string
 *             description: Seller country code.
 *           tax_id:
 *             type: string
 *             description: Seller tax ID.
 *           store_status:
 *             type: string
 *             enum: [active, inactive, suspended]
 *             description: The status of the seller's store.
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             seller:
 *               $ref: "#/components/schemas/AdminSeller"
 *   "404":
 *     description: Not Found
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: "Seller not found"
 * tags:
 *   - Admin Sellers
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSellerType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  await updateSellerWorkflow(req.scope).run({
    input: {
      id,
      ...req.validatedBody
    }
  })

  const {
    data: [seller]
  } = await query.graph({
    entity: 'seller',
    fields: req.queryConfig.fields,
    filters: { id }
  })

  res.json({ seller })
}
