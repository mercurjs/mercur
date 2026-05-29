/**
 * Product lifecycle events emitted by product workflows.
 *
 * SPEC-008 cleanup (step 5 follow-up): constants below carry `@deprecated`
 * tags per the dispositions in
 * `docs/specs/SPEC-008-drop-product-module-override.md#event-constant-cleanup-step-5-follow-up`.
 * The deprecated constants are still wired to legacy emitters under
 * `workflows/product/workflows/*` and `workflows/product-edit/workflows/*`;
 * they drop out of the file when those legacy groups are deleted in
 * step 5. Do not add new emit sites for any `@deprecated` constant.
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
  /**
   * Kept as a per-product shim after SPEC-008 step 5. Re-emitted by
   * `applyProductChangeActionsWorkflow` whenever a `STATUS_CHANGE → PUBLISHED`
   * action fires, so subscribers that key off the product (not the change)
   * stay wired without resolving `product_id` through the
   * `product_change_link` pivot.
   */
  PUBLISHED: "product.published",
  PROPOSED: "product.proposed",
  /**
   * @deprecated SPEC-008 step 5: replaced by
   * `ProductChangeWorkflowEvents.REQUIRES_ACTION` (per-change). Subscribers
   * keyed off this event must re-point at the new per-change event and
   * resolve `product_id` via the `product_change_link` pivot. Removed
   * once `workflows/product/workflows/request-product-changes.ts` is
   * deleted in step 5.
   */
  CHANGES_REQUESTED: "product.changes_requested",
  /**
   * @deprecated SPEC-008 step 5: replaced by
   * `ProductChangeWorkflowEvents.DECLINED`. Removed once
   * `workflows/product/workflows/reject-product.ts` is deleted in step 5.
   */
  REJECTED: "product.rejected",
  /**
   * @deprecated SPEC-008 step 5: replaced by
   * `ProductChangeWorkflowEvents.RESUBMITTED`. Removed once
   * `workflows/product/workflows/resubmit-product.ts` is deleted in step 5.
   */
  RESUBMITTED: "product.submission_resubmitted",
  /**
   * @deprecated SPEC-008 step 5: the `product-edit` legacy flow folds into
   * the standard change-lifecycle. `EDIT_REQUESTED` is replaced by
   * `ProductChangeWorkflowEvents.CREATED`. Removed when
   * `workflows/product-edit/` is retired in step 5.
   */
  EDIT_REQUESTED: "product.edit_requested",
  /**
   * @deprecated SPEC-008 step 5: replaced by
   * `ProductChangeWorkflowEvents.CANCELED`.
   */
  EDIT_CANCELED: "product.edit_canceled",
  /**
   * @deprecated SPEC-008 step 5: replaced by
   * `ProductChangeWorkflowEvents.DECLINED`.
   */
  EDIT_DECLINED: "product.edit_declined",
  /**
   * @deprecated SPEC-008 step 5: replaced by
   * `ProductChangeWorkflowEvents.CONFIRMED`.
   */
  EDIT_CONFIRMED: "product.edit_confirmed",
} as const

/**
 * @deprecated SPEC-008 step 5: brand is dropped — see "Drop `ProductBrand`"
 * in the spec. Brand becomes a category-scoped `ProductAttribute` with
 * `handle = "brand"`; the new attribute workflows under
 * `workflows/product-attribute/` emit `ProductAttributeWorkflowEvents`
 * instead. Removed when `workflows/product/workflows/{create,update,delete}-product-brands.ts`
 * are deleted in step 5.
 */
export const ProductBrandWorkflowEvents = {
  CREATED: "product_brand.created",
  UPDATED: "product_brand.updated",
  DELETED: "product_brand.deleted",
} as const

/**
 * @deprecated SPEC-008 step 5: owned by the standalone `product-attribute`
 * module — see `workflows/product-attribute/events.ts` for the canonical
 * `ProductAttributeWorkflowEvents` (note hyphenated event names:
 * `product-attribute.created` vs the legacy `product_attribute.created`).
 * Removed when the legacy attribute workflows under
 * `workflows/product/workflows/` are deleted in step 5.
 */
export const ProductAttributeWorkflowEvents = {
  CREATED: "product_attribute.created",
  UPDATED: "product_attribute.updated",
  DELETED: "product_attribute.deleted",
} as const

/**
 * @deprecated SPEC-008 step 5: owned by the standalone `product-attribute`
 * module — see `workflows/product-attribute/events.ts` for the canonical
 * `ProductAttributeValueWorkflowEvents`.
 */
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
