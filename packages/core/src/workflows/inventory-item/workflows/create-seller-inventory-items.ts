import { createInventoryItemsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreateInventoryItemInput } from "@medusajs/framework/types"

import { linkSellerInventoryItemStep } from "../steps"

type CreateSellerInventoryItemsWorkflowInput = {
  inventory_items: CreateInventoryItemInput[]
  seller_id: string
}

export const createSellerInventoryItemsWorkflow = createWorkflow(
  "create-seller-inventory-items",
  function (input: CreateSellerInventoryItemsWorkflowInput) {
    const createdInventoryItems = createInventoryItemsWorkflow.runAsStep({
      input: {
        items: input.inventory_items,
      },
    })

    const inventoryItemIds = transform(
      createdInventoryItems,
      (inventoryItems) => inventoryItems.map((item) => item.id)
    )

    linkSellerInventoryItemStep({
      seller_id: input.seller_id,
      inventory_item_ids: inventoryItemIds,
    })

    return new WorkflowResponse(createdInventoryItems)
  }
)
