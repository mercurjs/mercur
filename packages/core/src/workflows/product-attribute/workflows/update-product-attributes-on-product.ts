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
  createRemoteLinkStep,
  dismissRemoteLinkStep,
  updateProductOptionValuesOnProductStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductAttributeValueDTO,
  MercurModules,
  ProductAttributeBatchUpdate,
  ProductAttributeDTO,
} from "@mercurjs/types"

import { createProductAttributeValuesStep } from "../steps"
import { createProductAttributeValuesWorkflow } from "./create-product-attribute-values"
import { deleteProductAttributeValuesWorkflow } from "./delete-product-attribute-values"

export type UpdateProductAttributesOnProductWorkflowInput = {
  product_id: string
  update: ProductAttributeBatchUpdate[]
} & AdditionalData

export const updateProductAttributesOnProductWorkflowId =
  "update-product-attributes-on-product"

const isAxis = (attr?: ProductAttributeDTO) =>
  attr?.type === AttributeType.MULTI_SELECT &&
  !!attr?.is_variant_axis &&
  !!attr?.product_option_id

/**
 * Mutates a product's attribute selections (SPEC-014 §G update branch):
 * - shared axis  → adjust the per-product option value subset.
 * - exclusive axis (single target) → mutate the exclusive option's own values
 *   via the catalog value workflows (which keep the option mirror in sync).
 * - text/unit → create the new value + swap the product link.
 * - toggle → swap the linked true/false value.
 */
export const updateProductAttributesOnProductWorkflow = createWorkflow(
  updateProductAttributesOnProductWorkflowId,
  function (input: UpdateProductAttributesOnProductWorkflowInput) {
    const attributesQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: {
        id: transform({ input }, ({ input }) =>
          input.update.map((r) => r.id),
        ),
      },
      fields: [
        "id",
        "type",
        "is_variant_axis",
        "product_id",
        "product_option_id",
        "values.id",
        "values.name",
        "values.product_option_value_id",
      ],
    }).config({ name: "upd-pa-attributes" })

    // Currently-linked non-axis values (for text/unit/toggle swap dismissal).
    const productQuery = useQueryGraphStep({
      entity: "product",
      filters: { id: input.product_id },
      fields: ["attribute_values.id", "attribute_values.attribute.id"],
      options: { isList: false },
    }).config({ name: "upd-pa-product" })

    // 1. Shared-axis: adjust the per-product option value subset.
    const subsetUpdates = transform(
      { input, attributesQuery },
      ({ input, attributesQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const updates: ProductTypes.ProductOptionProductValueUpdate[] = []
        for (const ref of input.update) {
          const attr = attrsById.get(ref.id)
          if (!attr || !isAxis(attr) || attr.product_id) {
            continue
          }
          const optvalByValueId = new Map(
            (attr.values ?? []).map((v) => [v.id, v.product_option_value_id]),
          )
          const add = (ref.add ?? [])
            .filter((a): a is string => typeof a === "string")
            .map((vid) => optvalByValueId.get(vid))
            .filter((id): id is string => !!id)
          const remove = (ref.remove ?? [])
            .map((vid) => optvalByValueId.get(vid))
            .filter((id): id is string => !!id)
          if (add.length || remove.length) {
            updates.push({
              product_id: input.product_id,
              product_option_id: attr.product_option_id as string,
              add,
              remove,
            })
          }
        }
        return updates
      },
    )

    when(
      { subsetUpdates },
      ({ subsetUpdates }) => subsetUpdates.length > 0,
    ).then(() => updateProductOptionValuesOnProductStep(subsetUpdates))

    // 2. text/unit/toggle scalar swap.
    const swapPlan = transform(
      { input, attributesQuery, productQuery },
      ({ input, attributesQuery, productQuery }) => {
        const product_id = input.product_id
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const linkedByAttr = new Map<string, string[]>()
        for (const v of (productQuery.data?.attribute_values ?? []) as {
          id: string
          attribute?: { id: string }
        }[]) {
          if (!v.attribute) {
            continue
          }
          const list = linkedByAttr.get(v.attribute.id) ?? []
          list.push(v.id)
          linkedByAttr.set(v.attribute.id, list)
        }

        const newValueRows: (CreateProductAttributeValueDTO & {
          attribute_id: string
        })[] = []
        const toggleLinks: LinkDefinition[] = []
        const dismissLinks: LinkDefinition[] = []

        for (const ref of input.update) {
          if (ref.value === undefined) {
            continue
          }
          const attr = attrsById.get(ref.id)
          if (!attr) {
            continue
          }
          if (
            attr.type === AttributeType.TEXT ||
            attr.type === AttributeType.UNIT
          ) {
            newValueRows.push({
              name: String(ref.value),
              attribute_id: ref.id,
            })
            for (const vid of linkedByAttr.get(ref.id) ?? []) {
              dismissLinks.push({
                [Modules.PRODUCT]: { product_id },
                [MercurModules.PRODUCT_ATTRIBUTE]: {
                  product_attribute_value_id: vid,
                },
              })
            }
          } else if (attr.type === AttributeType.TOGGLE) {
            const seeded = (attr.values ?? []).find(
              (v) => v.name === String(ref.value),
            )
            if (seeded) {
              toggleLinks.push({
                [Modules.PRODUCT]: { product_id },
                [MercurModules.PRODUCT_ATTRIBUTE]: {
                  product_attribute_value_id: seeded.id,
                },
              })
            }
            for (const vid of linkedByAttr.get(ref.id) ?? []) {
              if (!seeded || vid !== seeded.id) {
                dismissLinks.push({
                  [Modules.PRODUCT]: { product_id },
                  [MercurModules.PRODUCT_ATTRIBUTE]: {
                    product_attribute_value_id: vid,
                  },
                })
              }
            }
          }
        }

        return { newValueRows, toggleLinks, dismissLinks }
      },
    )

    const createdSwapValues = createProductAttributeValuesStep(
      swapPlan.newValueRows,
    )

    const swapLinks = transform(
      { input, swapPlan, createdSwapValues },
      ({ input, swapPlan, createdSwapValues }) => {
        const product_id = input.product_id
        const links: LinkDefinition[] = (
          createdSwapValues as { id: string }[]
        ).map((v) => ({
          [Modules.PRODUCT]: { product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: v.id,
          },
        }))
        return [...links, ...swapPlan.toggleLinks]
      },
    )

    when(
      { swapPlan },
      ({ swapPlan }) => swapPlan.dismissLinks.length > 0,
    ).then(() =>
      dismissRemoteLinkStep(swapPlan.dismissLinks).config({
        name: "upd-pa-dismiss-value-links",
      }),
    )

    when({ swapLinks }, ({ swapLinks }) => swapLinks.length > 0).then(() =>
      createRemoteLinkStep(swapLinks).config({ name: "upd-pa-value-links" }),
    )

    // 3. Exclusive axis (single target): mutate the option's own values via the
    //    catalog value workflows (which keep the mirror in sync). Restricted to a
    //    single mirrored option, matching the value-workflow precedent.
    const exclusivePlan = transform(
      { input, attributesQuery },
      ({ input, attributesQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const exclusive = input.update.filter((ref) => {
          const attr = attrsById.get(ref.id)
          return !!attr && isAxis(attr) && !!attr.product_id
        })
        const target = exclusive.length === 1 ? exclusive[0] : undefined
        if (!target) {
          return {
            shouldAdd: false,
            shouldRemove: false,
            attribute_id: "",
            addValues: [] as CreateProductAttributeValueDTO[],
            removeIds: [] as string[],
          }
        }
        const attr = attrsById.get(target.id) as ProductAttributeDTO
        const addValues = (target.add ?? [])
          .filter((a): a is { value: string } => typeof a !== "string")
          .map((a) => ({ name: a.value }))
        const valueIdByOptval = new Map(
          (attr.values ?? []).map((v) => [v.product_option_value_id, v.id]),
        )
        const removeIds = (target.remove ?? [])
          .map((o) => valueIdByOptval.get(o))
          .filter((id): id is string => !!id)
        return {
          shouldAdd: addValues.length > 0,
          shouldRemove: removeIds.length > 0,
          attribute_id: target.id,
          addValues,
          removeIds,
        }
      },
    )

    when(
      { exclusivePlan },
      ({ exclusivePlan }) => exclusivePlan.shouldRemove,
    ).then(() =>
      deleteProductAttributeValuesWorkflow.runAsStep({
        input: { ids: exclusivePlan.removeIds },
      }),
    )

    when(
      { exclusivePlan },
      ({ exclusivePlan }) => exclusivePlan.shouldAdd,
    ).then(() =>
      createProductAttributeValuesWorkflow.runAsStep({
        input: {
          attribute_id: exclusivePlan.attribute_id,
          values: exclusivePlan.addValues,
        },
      }),
    )

    return new WorkflowResponse(void 0)
  },
)
