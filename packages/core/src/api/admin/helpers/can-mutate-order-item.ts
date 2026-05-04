export type OrderItemMutationLimits =
    | { canRemove: true; minQty: 0 }
    | {
          canRemove: false
          minQty: number
          reason: "fulfilled" | "returned" | "fulfilled_and_returned"
      }

export function getOrderItemMutationLimits(item: {
    quantity: number
    detail?: { fulfilled_quantity?: number; returned_quantity?: number }
}): OrderItemMutationLimits {
    const fulfilled = item.detail?.fulfilled_quantity ?? 0
    const returned = item.detail?.returned_quantity ?? 0
    if (fulfilled === 0 && returned === 0) {
        return { canRemove: true, minQty: 0 }
    }
    const minQty = fulfilled + returned
    const reason =
        fulfilled > 0 && returned > 0
            ? "fulfilled_and_returned"
            : fulfilled > 0
              ? "fulfilled"
              : "returned"
    return { canRemove: false, minQty, reason }
}
