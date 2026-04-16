import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { AdditionalData } from "@medusajs/framework/types"

import { updateProductVariantsWorkflow } from "../../../../../../workflows/product/workflows/update-product-variants"
import { deleteProductVariantsWorkflow } from "../../../../../../workflows/product/workflows/delete-product-variants"
import { AdminUpdateProductVariantType } from "../../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [variant],
  } = await query.graph({
    entity: "variant",
    fields: req.queryConfig.fields,
    filters: { id: req.params.variant_id, product_id: req.params.id },
  })

  if (!variant) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Variant with id ${req.params.variant_id} was not found on product ${req.params.id}`
    )
  }

  res.json({ variant })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    AdminUpdateProductVariantType & AdditionalData
  >,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const variantId = req.params.variant_id
  const { additional_data, ...update } = req.validatedBody

  await updateProductVariantsWorkflow(req.scope).run({
    input: {
      selector: { id: variantId, product_id: productId },
      update,
      additional_data,
    },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.json({ product })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const variantId = req.params.variant_id

  await deleteProductVariantsWorkflow(req.scope).run({
    input: { ids: [variantId] },
  })

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: req.queryConfig.fields,
    filters: { id: productId },
  })

  res.json({
    id: variantId,
    object: "variant",
    deleted: true,
    parent: product,
  })
}
