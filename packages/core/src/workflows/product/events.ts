/**
 * Product lifecycle events emitted by product workflows.
 *
 * Payload shapes:
 * - `PUBLISHED`: `Array<{ id: string; internal_note?: string }>` — emitted by
 *   `confirmProductsWorkflow`. One entry per confirmed product. `internal_note`
 *   is the operator-only note recorded on the corresponding `ProductChange`.
 * - `CHANGES_REQUESTED`: `{ id: string; message?: string }` — emitted by
 *   `requestProductChangesWorkflow`. `message` is the external note shown to
 *   the vendor explaining what needs to change.
 * - `REJECTED`: `{ id: string; message?: string }` — emitted by
 *   `rejectProductWorkflow`. `message` is the external note shown to the
 *   vendor explaining the rejection.
 */
export const ProductWorkflowEvents = {
  CREATED: "product.created",
  UPDATED: "product.updated",
  DELETED: "product.deleted",
  DRAFT: "product.draft",
  PUBLISHED: "product.published",
  PROPOSED: "product.proposed",
  CHANGES_REQUESTED: "product.changes_requested",
  REJECTED: "product.rejected",
  RESUBMITTED: "product.submission_resubmitted",
  EDIT_REQUESTED: "product.edit_requested",
  EDIT_CANCELED: "product.edit_canceled",
  EDIT_DECLINED: "product.edit_declined",
  EDIT_CONFIRMED: "product.edit_confirmed",
} as const

export const ProductBrandWorkflowEvents = {
  CREATED: "product_brand.created",
  UPDATED: "product_brand.updated",
  DELETED: "product_brand.deleted",
} as const

export const ProductAttributeWorkflowEvents = {
  CREATED: "product_attribute.created",
  UPDATED: "product_attribute.updated",
  DELETED: "product_attribute.deleted",
} as const

export const ProductAttributeValueWorkflowEvents = {
  CREATED: "product_attribute_value.created",
  UPDATED: "product_attribute_value.updated",
  DELETED: "product_attribute_value.deleted",
} as const

export const ProductCategoryWorkflowEvents = {
  CREATED: "product_category.created",
  UPDATED: "product_category.updated",
  DELETED: "product_category.deleted",
} as const

export const ProductVariantWorkflowEvents = {
  CREATED: "product_variant.created",
  UPDATED: "product_variant.updated",
  DELETED: "product_variant.deleted",
} as const

