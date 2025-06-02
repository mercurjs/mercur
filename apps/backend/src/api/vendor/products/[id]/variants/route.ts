import { AuthenticatedMedusaRequest, MedusaResponse, refetchEntities } from '@medusajs/framework'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'
import { createProductVariantsWorkflow } from '@medusajs/medusa/core-flows'

import { fetchSellerByAuthActorId } from '../../../../../shared/infra/http/utils'
import { CreateProductVariantType } from '../../validators'
import { remapVariantResponse } from '../../helpers'
import { remapKeysForVariant } from '../../helpers'
import { wrapVariantsWithTotalInventoryQuantity } from '@medusajs/medusa/api/utils/middlewares/products/variant-inventory-quantity'
import { HttpTypes } from '@medusajs/framework/types'
/**
 * @oas [post] /vendor/products/{id}/variants
 * operationId: "VendorCreateVariantForProductById"
 * summary: "Create variant for product"
 * description: "Creates variant for product."
 * x-authenticated: true
 * parameters:
 *   - in: path
 *     name: id
 *     required: true
 *     description: The ID of the Product.
 *     schema:
 *       type: string
 *   - name: fields
 *     in: query
 *     schema:
 *       type: string
 *     required: false
 *     description: Comma-separated fields to include in the response.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         $ref: "#/components/schemas/CreateProductVariant"
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             product:
 *               $ref: "#/components/schemas/VendorProduct"
 * tags:
 *   - Product
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<CreateProductVariantType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const seller = await fetchSellerByAuthActorId(
    req.auth_context.actor_id,
    req.scope
  )

  await createProductVariantsWorkflow.run({
    container: req.scope,
    input: {
      product_variants: [
        {
          ...req.validatedBody,
          product_id: req.params.id
        }
      ],
      additional_data: {
        seller_id: seller.id
      }
    }
  })

  const {
    data: [product]
  } = await query.graph(
    {
      entity: 'product',
      fields: req.queryConfig.fields,
      filters: { id: req.params.id }
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ product })
}

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminProductVariantParams>,
  res: MedusaResponse<HttpTypes.AdminProductVariantListResponse>
) => {
  const productId = req.params.id

  const withInventoryQuantity = req.queryConfig.fields.some((field) =>
    field.includes("inventory_quantity")
  )

  if (withInventoryQuantity) {
    req.queryConfig.fields = req.queryConfig.fields.filter(
      (field) => !field.includes("inventory_quantity")
    )
  }

  const { rows: variants, metadata } = await refetchEntities(
    "variant",
    { ...req.filterableFields, product_id: productId },
    req.scope,
    remapKeysForVariant(req.queryConfig.fields ?? []),
    req.queryConfig.pagination
  )

  if (withInventoryQuantity) {
    await wrapVariantsWithTotalInventoryQuantity(req, variants || [])
  }

  res.json({
    variants: variants.map(remapVariantResponse),
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}