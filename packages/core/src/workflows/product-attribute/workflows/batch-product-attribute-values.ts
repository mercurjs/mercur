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

import { createProductAttributeValuesStep } from "../steps"
import { syncProductAttributeOptionsWorkflow } from "./sync-product-attribute-options"

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

    // For non-select attribute types the UI sends free-text `values` —
    // upsert any name that doesn't already exist as a
    // `ProductAttributeValue`. Matches the validator's "Text/unit/toggle
    // types — provide new value strings" contract.
    const valuesToCreate = transform(
      { input, namedValues },
      ({ input, namedValues }) => {
        const matches = ((namedValues as { data?: unknown[] } | undefined)
          ?.data ?? []) as Array<{
            id: string
            name: string
            attribute_id: string | null
          }>
        const existing = new Set(
          matches
            .filter((v) => v.attribute_id)
            .map((v) => `${v.attribute_id}::${v.name}`),
        )
        const seen = new Set<string>()
        const out: { attribute_id: string; name: string }[] = []
        for (const entry of input.create ?? []) {
          for (const name of entry.values ?? []) {
            const trimmed = name?.trim()
            if (!trimmed) continue
            const key = `${entry.attribute_id}::${trimmed}`
            if (existing.has(key) || seen.has(key)) continue
            seen.add(key)
            out.push({ attribute_id: entry.attribute_id, name: trimmed })
          }
        }
        return out
      },
    )

    // Always invoke — the step short-circuits on an empty input — so the
    // workflow graph wires `createdNamedValues` deterministically into
    // `valueIdsToAttach` regardless of whether anything had to be upserted.
    const createdNamedValues = createProductAttributeValuesStep(
      valuesToCreate,
    ).config({ name: "batch-pa-create-named-values" })

    // Load attribute metadata once for the union of create + delete
    // attribute_ids — needed to (a) decide which refs are variant-axis
    // (and therefore need an accompanying product option) and (b)
    // resolve value ids → names for option synthesis.
    const attrMetaFilters = transform({ input }, ({ input }) => {
      const ids = new Set<string>()
      for (const entry of input.create ?? []) ids.add(entry.attribute_id)
      for (const id of input.delete ?? []) ids.add(id)
      return { ids: Array.from(ids), has_any: ids.size > 0 }
    })

    const attributesMeta = when(
      { attrMetaFilters },
      ({ attrMetaFilters }) => attrMetaFilters.has_any,
    ).then(() =>
      useQueryGraphStep({
        entity: "product_attribute",
        fields: [
          "id",
          "name",
          "is_variant_axis",
          "values.id",
          "values.name",
        ],
        filters: { id: attrMetaFilters.ids } as Record<string, unknown>,
      }).config({ name: "batch-pa-load-attribute-meta" }),
    )

    // Load the product's currently-linked attribute values so the delete
    // payload (which references attribute_ids, not value_ids) can be
    // expanded to the value_ids whose links need to be dismissed. Also
    // loads the product's options so variant-axis detachment can drop
    // the matching stock option in the same transaction.
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
        fields: [
          "attribute_values.id",
          "attribute_values.attribute.id",
          "options.id",
          "options.title",
        ],
        filters: { id: input.product_id },
      }).config({ name: "batch-pa-load-product" })
    )

    const valueIdsToAttach = transform(
      { input, namedValues, createdNamedValues, valuesToCreate },
      ({ input, namedValues, createdNamedValues, valuesToCreate }) => {
        const matches = ((namedValues as { data?: unknown[] } | undefined)
          ?.data ?? []) as Array<{
            id: string
            name: string
            attribute_id: string | null
          }>
        const created = (createdNamedValues ?? []) as Array<{ id: string }>
        const idByKey = new Map<string, string>()
        for (const v of matches) {
          if (v.attribute_id) idByKey.set(`${v.attribute_id}::${v.name}`, v.id)
        }
        // `createProductAttributeValuesStep` returns the new rows in the
        // same order as `valuesToCreate`, so pair them by index — the
        // returned shape may not include `attribute_id` (it's a belongsTo
        // FK and isn't always flattened on the create response).
        valuesToCreate.forEach((spec, idx) => {
          const row = created[idx]
          if (row?.id) idByKey.set(`${spec.attribute_id}::${spec.name}`, row.id)
        })

        const ids: string[] = []
        for (const entry of input.create ?? []) {
          if (entry.attribute_value_ids?.length) {
            ids.push(...entry.attribute_value_ids)
          }
          if (entry.values?.length) {
            for (const name of entry.values) {
              const trimmed = name?.trim()
              if (!trimmed) continue
              const id = idByKey.get(`${entry.attribute_id}::${trimmed}`)
              if (id) ids.push(id)
            }
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

    // Build the list of (product_id, title, values[]) entries for the
    // variant-axis create refs. Mirrors what `addProductAttributeWorkflow`
    // does for the single-attach case — a variant-axis attribute attach
    // must also produce a matching stock product option so the variant
    // form has somewhere to slot its axis values.
    const optionsToUpsert = transform(
      { input, attributesMeta },
      ({ input, attributesMeta }) => {
        const attrs = ((attributesMeta as { data?: unknown[] } | undefined)
          ?.data ?? []) as Array<{
            id: string
            name: string
            is_variant_axis: boolean
            values?: Array<{ id: string; name: string }>
          }>
        const byId = new Map(attrs.map((a) => [a.id, a]))

        const out: Array<{
          product_id: string
          title: string
          values: string[]
        }> = []
        for (const entry of input.create ?? []) {
          const attr = byId.get(entry.attribute_id)
          if (!attr?.is_variant_axis) continue

          const nameById = new Map(
            (attr.values ?? []).map((v) => [v.id, v.name]),
          )
          const names: string[] = []
          const seen = new Set<string>()
          const pushName = (name: string | undefined) => {
            if (!name || seen.has(name)) return
            seen.add(name)
            names.push(name)
          }

          for (const id of entry.attribute_value_ids ?? []) {
            pushName(nameById.get(id))
          }
          if (entry.values?.length) {
            // Variant-axis option upsert mirrors what `valueIdsToAttach`
            // links — both existing-by-name matches and newly-upserted
            // names contribute to the stock option's value set.
            for (const name of entry.values) {
              pushName(name?.trim())
            }
          }

          if (!names.length) continue
          out.push({
            product_id: input.product_id,
            title: attr.name,
            values: names,
          })
        }
        return out
      },
    )

    // For each variant-axis attribute being detached, drop the matching
    // product option (matched by title === attribute.name) — symmetric
    // to `detachProductAttributeWorkflow`.
    const optionIdsToDelete = transform(
      { input, attributesMeta, productAttributeValues },
      ({ input, attributesMeta, productAttributeValues }) => {
        if (!input.delete?.length) return []
        const attrs = ((attributesMeta as { data?: unknown[] } | undefined)
          ?.data ?? []) as Array<{
            id: string
            name: string
            is_variant_axis: boolean
          }>
        const byId = new Map(attrs.map((a) => [a.id, a]))
        const products = ((
          productAttributeValues as { data?: unknown[] } | undefined
        )?.data ?? []) as Array<{
          options?: Array<{ id: string; title: string }>
        }>
        const optionByTitle = new Map(
          (products[0]?.options ?? []).map((o) => [o.title, o.id]),
        )

        const ids: string[] = []
        for (const id of input.delete) {
          const attr = byId.get(id)
          if (!attr?.is_variant_axis) continue
          const optionId = optionByTitle.get(attr.name)
          if (optionId) ids.push(optionId)
        }
        return ids
      },
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

    syncProductAttributeOptionsWorkflow.runAsStep({
      input: transform(
        { optionsToUpsert, optionIdsToDelete },
        ({ optionsToUpsert, optionIdsToDelete }) => ({
          upsert: optionsToUpsert,
          delete_ids: optionIdsToDelete,
        }),
      ),
    })

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
