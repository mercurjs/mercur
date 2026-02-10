import { AdminOrder, AdminOrderChange } from "@medusajs/types"

export function getMissingLineItemIds(order: AdminOrder, changes: AdminOrderChange[]) {
  if (!changes?.length) {
    return []
  }

  const retIds = new Set<string>()
  const existingItemsMap = new Map(order.items.map((item) => [item.id, true]))

  changes.forEach((change) => {
    change.actions.forEach((action) => {
      if (!action.details?.reference_id) {
        return
      }

      if (
        (action.details.reference_id as string).startsWith("ordli_") &&
        !existingItemsMap.has(action.details.reference_id as string)
      ) {
        retIds.add(action.details.reference_id as string)
      }
    })
  })

  return Array.from(retIds)
}

