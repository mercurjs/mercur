import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  updateProductOptionsWorkflow,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"

export type MirrorProductAttributeRenameWorkflowInput = {
  product_attribute_id: string
  new_name: string
}

export const mirrorProductAttributeRenameWorkflowId =
  "mirror-product-attribute-rename"

/**
 * Propagates a `ProductAttribute.name` change to every linked
 * `ProductOption.title` row through the `product_option_attribute_link`
 * pivot ("Mirrored options for existing attributes" — SPEC-008).
 *
 * 1. Query Graph through `product_option.source_attribute.id` to find
 *    every option that has this attribute as its mirror source.
 * 2. If any options matched, run stock `updateProductOptionsWorkflow`
 *    with the new title. Stock workflow is idempotent — re-running
 *    against an option whose title already matches is a no-op DB-side.
 *
 * Triggered by the `product-attribute.updated` subscriber. Re-running
 * with the same `new_name` is a no-op (target rows already match).
 *
 * **Deferred**: fingerprint refresh on the link row. The reconciliation
 * job (out of scope this session) recomputes the fingerprint from the
 * current source name on each pass, so stale fingerprints are
 * self-healing. Live fingerprint updates require either `RemoteLink`
 * extra-column upsert (not first-class today) or a raw SQL pass; both
 * deferred to the reconciliation tooling sub-step.
 */
export const mirrorProductAttributeRenameWorkflow: ReturnWorkflow<
  MirrorProductAttributeRenameWorkflowInput,
  void,
  []
> = createWorkflow(
  mirrorProductAttributeRenameWorkflowId,
  function (input: MirrorProductAttributeRenameWorkflowInput) {
    const { data: linkedOptions } = useQueryGraphStep({
      entity: "product_option",
      fields: ["id", "title", "source_attribute.id"],
      filters: { source_attribute: { id: input.product_attribute_id } },
    }).config({ name: "pa-load-mirrored-options" })

    const linkedOptionIds = transform(
      { linkedOptions, input },
      ({ linkedOptions, input }) =>
        (linkedOptions ?? [])
          .filter(
            (o) =>
              (o as { source_attribute?: { id?: string } }).source_attribute
                ?.id === input.product_attribute_id,
          )
          .map((o) => (o as { id: string }).id),
    )

    when(
      { linkedOptionIds },
      ({ linkedOptionIds }) => linkedOptionIds.length > 0,
    ).then(() => {
      updateProductOptionsWorkflow.runAsStep({
        input: transform(
          { linkedOptionIds, input },
          ({ linkedOptionIds, input }) => ({
            selector: { id: linkedOptionIds },
            update: { title: input.new_name },
          }),
        ),
      })
    })

    return new WorkflowResponse(void 0)
  },
)
