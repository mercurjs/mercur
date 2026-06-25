import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { HttpTypes, ProductChangeDTO } from "@mercurjs/types"

import { productEditUpdateVariantsWorkflow } from "../../../../../../workflows/product-edit/workflows/product-edit-update-variants"
import { VendorUpdateProductVariantType } from "../../../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductVariantResponse>
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
      `Variant with id ${req.params.variant_id} was not found`
    )
  }

  res.json({ variant })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateProductVariantType>,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  const update = req.validatedBody

  const { result } = await productEditUpdateVariantsWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [
        {
          type: "update",
          variant_id: variantId,
          fields: update,
        },
      ],
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: result.id },
  })

  res.status(202).json({ product_change: product_change ?? result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<{ product_change: ProductChangeDTO }>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const variantId = req.params.variant_id

  const { result } = await productEditUpdateVariantsWorkflow(req.scope).run({
    input: {
      product_id: productId,
      created_by: sellerId,
      operations: [{ type: "remove", variant_id: variantId }],
    },
  })

  const {
    data: [product_change],
  } = await query.graph({
    entity: "product_change",
    fields: ["*", "actions.*"],
    filters: { id: result.id },
  })

  res.status(202).json({ product_change: product_change ?? result })
}
