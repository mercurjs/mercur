import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deleteInventoryItemWorkflow,
  updateInventoryItemsWorkflow,
} from "@medusajs/core-flows"
import { HttpTypes } from "@mercurjs/types"

import { refetchInventoryItem, validateSellerInventoryItem } from "../helpers"
import { VendorUpdateInventoryItemType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorInventoryItemResponse>
) => {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  if (!inventoryItem) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Inventory item with id: ${id} was not found`
    )
  }

  res.json({ inventory_item: inventoryItem })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<VendorUpdateInventoryItemType>,
  res: MedusaResponse<HttpTypes.VendorInventoryItemResponse>
) => {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  await updateInventoryItemsWorkflow(req.scope).run({
    input: {
      updates: [{ id, ...req.validatedBody }],
    },
  })

  const inventoryItem = await refetchInventoryItem(
    id,
    req.scope,
    req.queryConfig.fields
  )

  res.json({ inventory_item: inventoryItem })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.VendorInventoryItemDeleteResponse>
) => {
  const { id } = req.params

  await validateSellerInventoryItem(req.scope, req.auth_context.actor_id, id)

  await deleteInventoryItemWorkflow(req.scope).run({
    input: [id],
  })

  res.json({
    id,
    object: "inventory_item",
    deleted: true,
  })
}
