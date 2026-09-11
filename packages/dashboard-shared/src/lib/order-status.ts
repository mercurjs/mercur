import type { AdminOrder } from "@medusajs/types"

/**
 * An order in `requires_action` is awaiting a decision (e.g. a seller accepting it), so
 * fulfilment, edits, returns, claims, exchanges and payment actions stay unavailable until it
 * leaves that status, the same way they are on a canceled order.
 */
export const isOrderActionable = (order: Pick<AdminOrder, "status">): boolean =>
  order.status !== "canceled" && order.status !== "requires_action"

export const isOrderAwaitingAction = (
  order: Pick<AdminOrder, "status">
): boolean => order.status === "requires_action"
