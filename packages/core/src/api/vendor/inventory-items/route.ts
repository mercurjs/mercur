import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { HttpTypes } from "@mercurjs/types"

import { createSellerInventoryItemsWorkflow } from "../../../workflows/inventory-item"
import { refetchInventoryItem } from "./helpers"
import {
  VendorCreateInventoryItemType,
  VendorGetInventoryItemsParamsType,
} from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<VendorGetInventoryItemsParamsType>,
  res: MedusaResponse<HttpTypes.VendorInventoryItemListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: inventory_items, metadata } = await query.graph({
    entity: "inventory_item",
    fields: req.queryConfig.fields,
    filters: req.filterableFields,
    pagination: req.queryConfig.pagination,
  })

  res.json({
    inventory_items,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? 0,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorCreateInventoryItemType>,
  res: MedusaResponse<HttpTypes.VendorInventoryItemResponse>
) => {
  const sellerId = req.seller_context!.seller_id

  // When a SKU is supplied it must reference an existing variant owned by the
  // requesting seller; creating an inventory item for an unknown/foreign SKU
  // would leave a dangling record, so reject it as not found.
  const { sku } = req.validatedBody
  if (sku) {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product_id"],
      filters: { sku },
    })

    const productIds = variants
      .map((variant: { product_id: string | null }) => variant.product_id)
      .filter((id: string | null): id is string => Boolean(id))

    let matchesSeller = false
    if (productIds.length) {
      const { data: links } = await query.graph({
        entity: "product_seller",
        fields: ["product_id"],
        filters: { seller_id: sellerId, product_id: productIds },
      })
      matchesSeller = links.length > 0
    }

    if (!matchesSeller) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No variant found for SKU ${sku}`
      )
    }
  }

  const { result } = await createSellerInventoryItemsWorkflow(req.scope).run({
    input: {
      seller_id: sellerId,
      inventory_items: [req.validatedBody],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    result[0].id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ inventory_item: inventoryItem })
}
