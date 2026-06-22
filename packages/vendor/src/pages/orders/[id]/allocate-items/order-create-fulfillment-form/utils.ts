export type AllocationQuantityMap = Record<string, number | string>
export type AllocationSelectedMap = Record<string, boolean>

type AllocatableItem = {
  id: string
  quantity: number
  detail?: { fulfilled_quantity?: number | null } | null
  offer?: { inventory_item_link?: unknown[] | null } | null
}

type AllocatableReservation = { line_item_id?: string | null }

/**
 * Selects the order line items that can still be allocated.
 *
 * Mirrors `showAllocateButton` in the order summary: an item is allocatable
 * only when it is inventory-managed (`offer.inventory_item_link`), still has
 * unfulfilled quantity, and does **not** already have a reservation.
 *
 * Regression guard (MER-187): the form previously listed every unfulfilled
 * inventory-managed item — including ones that were already allocated — and
 * pre-selected them all. Submitting then created a *second* reservation for
 * the already-allocated items. Because Mercur offers link inventory to the
 * offer (not the variant), the order summary fetches reservations with a
 * one-per-line-item limit, so the surplus duplicate reservations pushed the
 * freshly-added item's reservation out of the response and its badge stayed
 * "Not allocated" even though allocation reported success. Excluding
 * already-reserved items keeps one reservation per line item.
 */
export function getAllocatableItems<T extends AllocatableItem>(
  items: T[],
  reservations: AllocatableReservation[]
): T[] {
  const reserved = new Set(
    reservations
      .map((r) => r.line_item_id)
      .filter((id): id is string => !!id)
  )

  return items.filter(
    (item) =>
      !!item.offer?.inventory_item_link?.length &&
      item.quantity - (item.detail?.fulfilled_quantity ?? 0) > 0 &&
      !reserved.has(item.id)
  )
}

export type AllocationLineInput = {
  line_item_id: string
  inventory_item_id: string
  quantity: number
}

export type BuildAllocationResult =
  | { ok: true; items: AllocationLineInput[] }
  | { ok: false; reason: "no-items" | "invalid-quantity" }

/**
 * Turns the form's `quantity` / `selected` maps into the list of reservations
 * to create.
 *
 * Quantity keys are `${lineItemId}-${inventoryItemId}`. Inventory kits also
 * store a root aggregator under `${lineItemId}-` (trailing dash) that only
 * drives the UI — it must never become a reservation, so it is dropped here.
 *
 * Regression guard (MER-187): the previous implementation built the payload
 * inline and only bailed out when a quantity was an empty string. An empty
 * payload (no rows, or every item deselected) slipped through `[].some(...)`,
 * `Promise.all([])` resolved, and the form reported a successful allocation
 * while nothing was reserved. Returning an explicit `ok: false` makes the
 * caller surface an error instead of a false success.
 */
export function buildAllocationPayload(
  quantity: AllocationQuantityMap,
  selected: AllocationSelectedMap
): BuildAllocationResult {
  const rows = Object.entries(quantity)
    .filter(([key]) => !key.endsWith("-"))
    .map(([key, value]) => {
      const separatorIndex = key.indexOf("-")
      return {
        lineItemId: key.slice(0, separatorIndex),
        inventoryItemId: key.slice(separatorIndex + 1),
        value,
      }
    })
    // Default (undefined) is selected; only an explicit `false` deselects.
    .filter((row) => selected[row.lineItemId] !== false)

  if (rows.length === 0) {
    return { ok: false, reason: "no-items" }
  }

  const items: AllocationLineInput[] = []

  for (const row of rows) {
    if (row.value === "" || row.value === null || row.value === undefined) {
      return { ok: false, reason: "invalid-quantity" }
    }

    const quantityNumber = Number(row.value)
    if (!Number.isFinite(quantityNumber) || quantityNumber <= 0) {
      return { ok: false, reason: "invalid-quantity" }
    }

    items.push({
      line_item_id: row.lineItemId,
      inventory_item_id: row.inventoryItemId,
      quantity: quantityNumber,
    })
  }

  return { ok: true, items }
}
