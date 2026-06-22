/**
 * Lifecycle events emitted by the product workflows. Audit-trail
 * `ProductChange` rows record what happened; events let listeners
 * react (notifications, search indexing, etc.) without coupling to
 * the change-row schema.
 */
export const ProductWorkflowEvents = {
  CREATED: "product.created",
  PUBLISHED: "product.published",
  REJECTED: "product.rejected",
  CHANGE_REQUESTED: "product.change-requested",
} as const
