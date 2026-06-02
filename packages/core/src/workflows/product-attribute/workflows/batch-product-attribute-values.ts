import { Modules } from "@medusajs/framework/utils"
import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { MercurModules } from "@mercurjs/types"

export type BatchProductAttributeValuesCreateInput = {
  attribute_id: string
  attribute_value_ids?: string[]
  values?: string[]
}

export type BatchProductAttributeValuesWorkflowInput = {
  product_id: string
  create?: BatchProductAttributeValuesCreateInput[]
  delete?: string[]
}

export type BatchProductAttributeValuesWorkflowHooks = [
  Hook<
    "validate",
    { input: BatchProductAttributeValuesWorkflowInput },
    unknown
  >,
  Hook<
    "productAttributeValuesBatched",
    {
      product_id: string
      attached_value_ids: string[]
      detached_value_ids: string[]
    },
    unknown
  >,
]

export const batchProductAttributeValuesWorkflowId =
  "batch-product-attribute-values"

export const batchProductAttributeValuesWorkflow: ReturnWorkflow<
  BatchProductAttributeValuesWorkflowInput,
  void,
  BatchProductAttributeValuesWorkflowHooks
> = createWorkflow(
  batchProductAttributeValuesWorkflowId,
  function (input: BatchProductAttributeValuesWorkflowInput) {
    const validate = createHook("validate", { input })

    // Collect candidate (attribute_id, name) pairs into one query so
    // free-text `values` in the create payload can be resolved to ids.
    const nameLookupFilters = transform({ input }, ({ input }) => {
      const attributeIds = new Set<string>()
      const names = new Set<string>()
      for (const entry of input.create ?? []) {
        if (entry.values?.length) {
          attributeIds.add(entry.attribute_id)
          entry.values.forEach((n) => names.add(n))
        }
      }
      return {
        attribute_ids: Array.from(attributeIds),
        names: Array.from(names),
        has_lookups: attributeIds.size > 0,
      }
    })

    const namedValues = when(
      { nameLookupFilters },
      ({ nameLookupFilters }) => nameLookupFilters.has_lookups
    ).then(() =>
      useQueryGraphStep({
        entity: "product_attribute_value",
        fields: ["id", "name", "attribute_id"],
        filters: {
          attribute_id: nameLookupFilters.attribute_ids,
          name: nameLookupFilters.names,
        } as Record<string, unknown>,
      }).config({ name: "batch-pa-resolve-named-values" })
    )

    // Load the product's currently-linked attribute values so the delete
    // payload (which references attribute_ids, not value_ids) can be
    // expanded to the value_ids whose links need to be dismissed.
    const hasDeletes = transform(
      { input },
      ({ input }) => (input.delete?.length ?? 0) > 0
    )

    const productAttributeValues = when(
      { hasDeletes },
      ({ hasDeletes }) => hasDeletes
    ).then(() =>
      useQueryGraphStep({
        entity: "product",
        fields: ["attribute_values.id", "attribute_values.attribute.id"],
        filters: { id: input.product_id },
      }).config({ name: "batch-pa-load-product" })
    )

    const valueIdsToAttach = transform(
      { input, namedValues },
      ({ input, namedValues }) => {
        const ids: string[] = []
        const matches = ((namedValues as { data?: unknown[] } | undefined)
          ?.data ?? []) as Array<{
          id: string
          name: string
          attribute_id: string | null
        }>
        for (const entry of input.create ?? []) {
          if (entry.attribute_value_ids?.length) {
            ids.push(...entry.attribute_value_ids)
          }
          if (entry.values?.length) {
            const names = new Set(entry.values)
            const matched = matches.filter(
              (v) =>
                v.attribute_id === entry.attribute_id && names.has(v.name)
            )
            ids.push(...matched.map((v) => v.id))
          }
        }
        return ids
      }
    )

    const valueIdsToDetach = transform(
      { input, productAttributeValues },
      ({ input, productAttributeValues }) => {
        const toDelete = new Set(input.delete ?? [])
        if (toDelete.size === 0) return []
        const products = ((
          productAttributeValues as { data?: unknown[] } | undefined
        )?.data ?? []) as Array<{
          attribute_values?: Array<{
            id: string
            attribute?: { id?: string }
          }>
        }>
        const values = products[0]?.attribute_values ?? []
        return values
          .filter((v) => v.attribute?.id && toDelete.has(v.attribute.id))
          .map((v) => v.id)
      }
    )

    const attachLinks = transform(
      { valueIdsToAttach, input },
      ({ valueIdsToAttach, input }) =>
        valueIdsToAttach.map((value_id) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: value_id,
          },
        }))
    )

    const detachLinks = transform(
      { valueIdsToDetach, input },
      ({ valueIdsToDetach, input }) =>
        valueIdsToDetach.map((value_id) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: value_id,
          },
        }))
    )

    when(
      { valueIdsToAttach },
      ({ valueIdsToAttach }) => valueIdsToAttach.length > 0
    ).then(() =>
      createRemoteLinkStep(attachLinks).config({
        name: "batch-pa-attach-links",
      })
    )

    when(
      { valueIdsToDetach },
      ({ valueIdsToDetach }) => valueIdsToDetach.length > 0
    ).then(() =>
      dismissRemoteLinkStep(detachLinks).config({
        name: "batch-pa-detach-links",
      })
    )

    const productAttributeValuesBatched = createHook(
      "productAttributeValuesBatched",
      {
        product_id: input.product_id,
        attached_value_ids: valueIdsToAttach,
        detached_value_ids: valueIdsToDetach,
      }
    )

    return new WorkflowResponse(void 0, {
      hooks: [validate, productAttributeValuesBatched],
    })
  }
)
