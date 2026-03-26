import {
  deleteProductOptionsWorkflow,
  updateProductOptionsWorkflow,
} from "@medusajs/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { validateSellerProduct } from "../../../helpers"
import { VendorUpdateProductOptionType } from "../../../validators"
import { convertOptionToAttributeWorkflow } from "../../../../../../workflows/product-attribute/workflows/convert-option-to-attribute"
import { transformProductWithInformationalAttributes } from "../../../utils/transform-product-attributes"

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductOptionType>,
  res: MedusaResponse<HttpTypes.VendorProductResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.auth_context.actor_id
  const { additional_data, convert_to_attribute, ...update } =
    req.validatedBody as any

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  if (convert_to_attribute) {
    // Fetch option details to get values and metadata
    const {
      data: [option],
    } = await query.graph({
      entity: "product_option",
      fields: ["id", "title", "values.*", "metadata"],
      filters: { id: req.params.option_id },
    })

    const attributeId = option?.metadata?.attribute_id as
      | string
      | undefined

    if (attributeId) {
      await convertOptionToAttributeWorkflow(req.scope).run({
        input: {
          product_id: req.params.id,
          option_id: req.params.option_id,
          seller_id: sellerId,
          attribute_id: attributeId,
          values:
            option.values?.map((v: { value: string }) => v.value) ?? [],
        },
      })
    } else {
      // No linked attribute — just delete the option
      await deleteProductOptionsWorkflow(req.scope).run({
        input: { ids: [req.params.option_id] },
      })
    }
  } else {
    await updateProductOptionsWorkflow(req.scope).run({
      input: {
        selector: { id: req.params.option_id },
        update,
        additional_data: {
          ...additional_data,
          seller_id: sellerId,
        },
      },
    })
  }

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: req.params.id },
  })

  const transformedProduct = transformProductWithInformationalAttributes(
    product as any
  )

  res.json({ product: transformedProduct })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorDeleteResponse>
) => {
  const sellerId = req.auth_context.actor_id

  await validateSellerProduct(req.scope, sellerId, req.params.id)

  await deleteProductOptionsWorkflow(req.scope).run({
    input: { ids: [req.params.option_id] },
  })

  res.json({
    id: req.params.option_id,
    object: "product_option",
    deleted: true,
  })
}
