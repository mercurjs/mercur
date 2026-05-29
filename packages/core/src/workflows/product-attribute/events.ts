/**
 * Lifecycle events emitted by the new `product-attribute` module's
 * workflows. Distinct from the legacy `ProductAttributeWorkflowEvents`
 * in `../product/events.ts`: the legacy emitter targets the fused
 * Mercur product module; this group targets the standalone
 * `productAttribute` module. Once the legacy product workflow group
 * is removed in step 5, the legacy event constants can be deleted
 * and these become the canonical names.
 */
export const ProductAttributeWorkflowEvents = {
  CREATED: "product-attribute.created",
  UPDATED: "product-attribute.updated",
  DELETED: "product-attribute.deleted",
} as const

export const ProductAttributeValueWorkflowEvents = {
  CREATED: "product-attribute-value.created",
  UPDATED: "product-attribute-value.updated",
  DELETED: "product-attribute-value.deleted",
} as const
