import { AdminOrderChange } from "@medusajs/types"

export function countItemsChange(actions: AdminOrderChange["actions"]) {
  let added = 0
  let removed = 0

  actions.forEach((action) => {
    if (action.action === "ITEM_ADD") {
      added += action.details!.quantity as number
    }
    if (action.action === "ITEM_UPDATE") {
      const quantityDiff = action.details!.quantity_diff as number

      if (quantityDiff > 0) {
        added += quantityDiff
      } else {
        removed += Math.abs(quantityDiff)
      }
    }
  })

  return [added, removed]
}

