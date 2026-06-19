import { Modules } from "@medusajs/framework/utils"
import {
  AdditionalData,
  LinkDefinition,
  ProductTypes,
} from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addProductOptionsToProductStep,
  createProductOptionsStep,
  createRemoteLinkStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductAttributeDTO,
  CreateProductAttributeValueDTO,
  MercurModules,
  ProductAttributeBatchAdd,
  ProductAttributeDTO,
} from "@mercurjs/types"

import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
} from "../steps"

export type AddProductAttributesToProductWorkflowInput = {
  /** The id of the product to attach attributes to. */
  product_id: string
  /**
   * The attributes to attach. Each entry is one of the
   * {@link ProductAttributeBatchAdd} forms: an existing select/axis ref
   * (`{ id, value_ids }`), an existing text/unit/toggle ref (`{ id, value }`),
   * an inline axis (`{ title, values, is_variant_axis: true }`), or an inline
   * non-axis (`{ title, type, value | values }`).
   */
  add: ProductAttributeBatchAdd[]
} & AdditionalData

/**
 * Accepts a single product's attribute batch or many at once. The batched form
 * lets `createProductsWorkflow` attach attributes for every created product in
 * one run.
 */
export type AddProductAttributesToProductWorkflowInputOrList =
  | AddProductAttributesToProductWorkflowInput
  | AddProductAttributesToProductWorkflowInput[]

export const addProductAttributesToProductWorkflowId =
  "add-product-attributes-to-product"

const isExisting = (
  ref: ProductAttributeBatchAdd,
): ref is Extract<ProductAttributeBatchAdd, { id: string }> => "id" in ref

const key = (itemIdx: number, addIdx: number) => `${itemIdx}:${addIdx}`

export const addProductAttributesToProductWorkflow = createWorkflow(
  addProductAttributesToProductWorkflowId,
  function (input: AddProductAttributesToProductWorkflowInputOrList) {
    // Normalize to a list so every transform iterates products uniformly.
    const items = transform({ input }, ({ input }) =>
      Array.isArray(input) ? input : [input],
    )

    // Resolve every referenced existing attribute (type/axis + value mirrors).
    const attributesQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: {
        id: transform({ items }, ({ items }) =>
          items.flatMap((it) => it.add.filter(isExisting).map((r) => r.id)),
        ),
      },
      fields: [
        "id",
        "name",
        "type",
        "is_variant_axis",
        "product_id",
        "product_option_id",
        "values.id",
        "values.name",
        "values.product_option_value_id",
      ],
    }).config({ name: "add-pa-attributes" })

    // 1. Create the exclusive native options for every inline axis ref.
    const optionsPlan = transform({ items }, ({ items }) => {
      const inlineAxisOptions: ProductTypes.CreateProductOptionDTO[] = []
      const optionIdxByKey: Record<string, number> = {}
      items.forEach((it, i) => {
        it.add.forEach((ref, j) => {
          if (!isExisting(ref) && ref.is_variant_axis) {
            optionIdxByKey[key(i, j)] = inlineAxisOptions.length
            inlineAxisOptions.push({
              title: ref.title,
              is_exclusive: true,
              values: ref.values ?? [],
            })
          }
        })
      })
      return { inlineAxisOptions, optionIdxByKey }
    })

    const inlineOptions = createProductOptionsStep(optionsPlan.inlineAxisOptions)

    // 2. Create the product-scoped attributes for all inline refs.
    const attrsPlan = transform(
      { items, optionsPlan, inlineOptions },
      ({ items, optionsPlan, inlineOptions }) => {
        const inlineAttrs: CreateProductAttributeDTO[] = []
        const attrIdxByKey: Record<string, number> = {}
        items.forEach((it, i) => {
          it.add.forEach((ref, j) => {
            if (isExisting(ref)) {
              return
            }
            attrIdxByKey[key(i, j)] = inlineAttrs.length
            const optionIdx = optionsPlan.optionIdxByKey[key(i, j)]
            if (ref.is_variant_axis) {
              inlineAttrs.push({
                name: ref.title,
                type: AttributeType.MULTI_SELECT,
                is_variant_axis: true,
                is_filterable: ref.is_filterable ?? false,
                is_required: ref.is_required ?? false,
                description: ref.description ?? null,
                metadata: ref.metadata ?? null,
                product_id: it.product_id,
                product_option_id: inlineOptions[optionIdx].id,
              })
            } else {
              const inferredType =
                ref.type ??
                (typeof ref.value === "boolean"
                  ? AttributeType.TOGGLE
                  : AttributeType.TEXT)
              inlineAttrs.push({
                name: ref.title,
                type: inferredType,
                is_variant_axis: false,
                is_filterable: ref.is_filterable ?? false,
                is_required: ref.is_required ?? false,
                description: ref.description ?? null,
                metadata: ref.metadata ?? null,
                product_id: it.product_id,
              })
            }
          })
        })
        return { inlineAttrs, attrIdxByKey }
      },
    )

    const inlineAttrs = createProductAttributesStep(attrsPlan.inlineAttrs)

    // 3. Create the attribute values (inline axis mirrors / inline non-axis /
    //    existing text-unit free-form). `linkProductId[i]` is the product to
    //    link the created row to, or null for axis values (which live on the
    //    option only).
    const valuePlan = transform(
      { items, attributesQuery, optionsPlan, inlineOptions, attrsPlan },
      ({ items, attributesQuery, optionsPlan, inlineOptions, attrsPlan }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const rows: (CreateProductAttributeValueDTO & {
          attribute_id: string
        })[] = []
        const linkProductId: (string | null)[] = []

        items.forEach((it, i) => {
          it.add.forEach((ref, j) => {
            if (!isExisting(ref)) {
              const attrIdx = attrsPlan.attrIdxByKey[key(i, j)]
              const attributeId = inlineAttrs[attrIdx].id
              if (ref.is_variant_axis) {
                const optionIdx = optionsPlan.optionIdxByKey[key(i, j)]
                for (const ov of inlineOptions[optionIdx].values ?? []) {
                  rows.push({
                    name: ov.value,
                    attribute_id: attributeId,
                    product_option_value_id: ov.id,
                  })
                  // Link inline-axis values to the product too: the formatter
                  // reads the selected axis subset from the
                  // product_attribute_value_link pivot (native options populate
                  // is broken on 2.16). Every value of an exclusive inline
                  // option is selected.
                  linkProductId.push(it.product_id)
                }
              } else {
                const names =
                  ref.values ??
                  (ref.value !== undefined ? [String(ref.value)] : [])
                for (const name of names) {
                  rows.push({ name, attribute_id: attributeId })
                  linkProductId.push(it.product_id)
                }
              }
              return
            }

            // Existing text/unit: create a value from the free-form scalar.
            const attr = attrsById.get(ref.id)
            if (
              attr &&
              (attr.type === AttributeType.TEXT ||
                attr.type === AttributeType.UNIT) &&
              ref.value !== undefined
            ) {
              rows.push({ name: String(ref.value), attribute_id: ref.id })
              linkProductId.push(it.product_id)
            }
          })
        })

        return { rows, linkProductId }
      },
    )

    const createdValues = createProductAttributeValuesStep(valuePlan.rows)

    // 4. Attach native options (existing axis subset + inline axis full set).
    const optionPairs = transform(
      { items, attributesQuery, optionsPlan, inlineOptions },
      ({ items, attributesQuery, optionsPlan, inlineOptions }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const pairs: ProductTypes.ProductOptionProductPair[] = []
        items.forEach((it, i) => {
          it.add.forEach((ref, j) => {
            if (isExisting(ref)) {
              const attr = attrsById.get(ref.id)
              const isAxis =
                attr?.type === AttributeType.MULTI_SELECT &&
                !!attr?.is_variant_axis &&
                !!attr?.product_option_id
              if (!attr || !isAxis) {
                return
              }
              const optValByValueId = new Map(
                (attr.values ?? []).map((v) => [
                  v.id,
                  v.product_option_value_id,
                ]),
              )
              const product_option_value_ids = (ref.value_ids ?? [])
                .map((vid) => optValByValueId.get(vid))
                .filter((id): id is string => !!id)
              pairs.push({
                product_id: it.product_id,
                product_option_id: attr.product_option_id as string,
                product_option_value_ids,
              })
            } else if (ref.is_variant_axis) {
              const optionIdx = optionsPlan.optionIdxByKey[key(i, j)]
              pairs.push({
                product_id: it.product_id,
                product_option_id: inlineOptions[optionIdx].id,
              })
            }
          })
        })
        return pairs
      },
    )

    when({ optionPairs }, ({ optionPairs }) => optionPairs.length > 0).then(() =>
      addProductOptionsToProductStep(optionPairs),
    )

    // 5. Build all product↔value links: created values (with their product) +
    //    existing select value_ids + existing toggle resolved value.
    const valueLinks = transform(
      { items, attributesQuery, valuePlan, createdValues },
      ({ items, attributesQuery, valuePlan, createdValues }) => {
        const links: LinkDefinition[] = []

        ;(createdValues as { id: string }[]).forEach((v, i) => {
          const product_id = valuePlan.linkProductId[i]
          if (product_id) {
            links.push({
              [Modules.PRODUCT]: { product_id },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_value_id: v.id,
              },
            })
          }
        })

        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        for (const it of items) {
          for (const ref of it.add) {
            if (!isExisting(ref)) {
              continue
            }
            const attr = attrsById.get(ref.id)
            if (!attr) {
              continue
            }

            if (attr.type === AttributeType.TOGGLE && ref.value !== undefined) {
              const seeded = (attr.values ?? []).find(
                (v) => v.name === String(ref.value),
              )
              if (seeded) {
                links.push({
                  [Modules.PRODUCT]: { product_id: it.product_id },
                  [MercurModules.PRODUCT_ATTRIBUTE]: {
                    product_attribute_value_id: seeded.id,
                  },
                })
              }
            } else {
              // Existing select value_ids — non-axis AND axis. Axis values are
              // linked into the pivot too so the formatter can render the
              // selected-of-available subset (native options populate is broken
              // on 2.16). Text/unit refs carry no value_ids, so this is a no-op
              // for them; toggle is handled above.
              for (const vid of ref.value_ids ?? []) {
                links.push({
                  [Modules.PRODUCT]: { product_id: it.product_id },
                  [MercurModules.PRODUCT_ATTRIBUTE]: {
                    product_attribute_value_id: vid,
                  },
                })
              }
            }
          }
        }

        return links
      },
    )

    when({ valueLinks }, ({ valueLinks }) => valueLinks.length > 0).then(() =>
      createRemoteLinkStep(valueLinks).config({
        name: "add-pa-value-links",
      }),
    )

    return new WorkflowResponse(void 0)
  },
)
