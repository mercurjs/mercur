export const getFulfillableQuantity = (item: { quantity?: number; detail?: { fulfilled_quantity?: number } }) => {
  if (item.quantity == null || item.detail?.fulfilled_quantity == null) {
    return 0
  }
  return item.quantity - item.detail.fulfilled_quantity
}
