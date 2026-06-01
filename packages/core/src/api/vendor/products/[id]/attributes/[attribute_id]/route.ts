import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { dismissRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { createWorkflow, transform, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { HttpTypes, MercurModules } from "@mercurjs/types"

import { ensureSellerOwnsProduct } from "../../../helpers"

const detachProductAttributeWorkflow = createWorkflow(
  "vendor-detach-product-attribute-values",
  function (input: { product_id: string; value_ids: string[] }) {
    const links = transform({ input }, ({ input }) =>
      input.value_ids.map((value_id) => ({
        [Modules.PRODUCT]: { product_id: input.product_id },
        [MercurModules.PRODUCT_ATTRIBUTE]: {
          product_attribute_value_id: value_id,
        },
      }))
    )

    dismissRemoteLinkStep(links as any)
    return new WorkflowResponse(void 0)
  }
)

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorProductAttributeResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const productId = req.params.id
  const attributeId = req.params.attribute_id

  const {
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: [
      "attribute_values.id",
      "attribute_values.name",
      "attribute_values.attribute.id",
      "attribute_values.attribute.name",
      "attribute_values.attribute.type",
    ],
    filters: { id: productId },
  })

  if (!product) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product with id ${productId} was not found`
    )
  }

  const values = ((product as any).attribute_values ?? []).filter(
    (v: any) => v.attribute?.id === attributeId
  )

  if (!values.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Attribute with id ${attributeId} was not found on product ${productId}`
    )
  }

  const product_attribute = {
    ...values[0].attribute,
    values: values.map((v: any) => ({ id: v.id, name: v.name })),
  }

  res.json({ product_attribute })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const sellerId = req.seller_context!.seller_id
  const productId = req.params.id
  const attributeId = req.params.attribute_id

  await ensureSellerOwnsProduct(req.scope, sellerId, productId)

  // Find every linked value id that belongs to the target attribute.
  const { data } = await query.graph({
    entity: "product",
    fields: ["attribute_values.id", "attribute_values.attribute.id"],
    filters: { id: productId },
  })

  const valueIds: string[] = ((data[0] as any)?.attribute_values ?? [])
    .filter((v: any) => v.attribute?.id === attributeId)
    .map((v: any) => v.id)

  if (valueIds.length) {
    await detachProductAttributeWorkflow(req.scope).run({
      input: { product_id: productId, value_ids: valueIds },
    })
  }

  res.json({
    id: attributeId,
    object: "product_attribute",
    deleted: true,
  })
}
