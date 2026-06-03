import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AttributeType, HttpTypes } from "@mercurjs/types"

import { addProductAttributeWorkflow } from "../../../../../workflows/product-attribute/workflows"
import { groupProductAttributeValues } from "../../../../utils/format-product-attributes"
import { AdminAddProductAttributeType } from "../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminProductAttributeListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "attribute_values.id",
      "attribute_values.name",
      "attribute_values.attribute.id",
      "attribute_values.attribute.name",
      "attribute_values.attribute.handle",
      "attribute_values.attribute.type",
      "attribute_values.attribute.is_variant_axis",
    ],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const product_attributes = groupProductAttributeValues(
    product.attribute_values
  )

  res.json({
    product_attributes,
    count: product_attributes.length,
    offset: 0,
    limit: product_attributes.length,
  } as HttpTypes.AdminProductAttributeListResponse)
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAddProductAttributeType>,
  res: MedusaResponse<HttpTypes.AdminProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const body = req.validatedBody

  await addProductAttributeWorkflow(req.scope).run({
    input: {
      product_id: productId,
      attribute_id: body.attribute_id,
      value_ids: body.attribute_value_ids,
      name: body.name,
      type: body.type as AttributeType | undefined,
      values: body.values,
      is_variant_axis: body.is_variant_axis,
      is_filterable: body.is_filterable,
      is_required: body.is_required,
      description: body.description ?? null,
      metadata: body.metadata ?? null,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.status(201).json({ product })
}
