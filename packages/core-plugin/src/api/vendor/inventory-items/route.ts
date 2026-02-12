import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
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
  const sellerId = req.auth_context.actor_id

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
