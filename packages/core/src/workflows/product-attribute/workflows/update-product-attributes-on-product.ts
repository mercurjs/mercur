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

import {
  createProductAttributeValuesStep,
  detachProductOptionValuesFromProductStep,
  updateProductAttributeValuesStep,
} from "../steps"
import { createProductAttributeValuesWorkflow } from "./create-product-attribute-values"
import { deleteProductAttributeValuesWorkflow } from "./delete-product-attribute-values"
import { updateProductAttributesWorkflow } from "./update-product-attributes"

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

    const productQuery = useQueryGraphStep({
      entity: "product",
      filters: { id: input.product_id },
      fields: [
        "product_attribute_values.id",
        "product_attribute_values.attribute.id",
      ],
      options: { isList: false },
    }).config({ name: "upd-pa-product" })

    // The formatter reads the selected axis subset from the pivot (native
    // options populate is broken on 2.16), so the product_attribute_value_link
    // pivot must be kept in sync with the option value subset.
    const subsetPlan = transform(
      { input, attributesQuery },
      ({ input, attributesQuery }) => {
        const product_id = input.product_id
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const updates: ProductTypes.ProductOptionProductValueUpdate[] = []
        const addLinks: LinkDefinition[] = []
        const dismissLinks: LinkDefinition[] = []
        for (const ref of input.update) {
          const attr = attrsById.get(ref.id)
          if (!attr || !isAxis(attr) || attr.product_id) {
            continue
          }
          const optvalByValueId = new Map(
            (attr.values ?? []).map((v) => [v.id, v.product_option_value_id]),
          )
          const addValueIds = (ref.add ?? []).filter(
            (a): a is string => typeof a === "string",
          )
          const removeValueIds = (ref.remove ?? []).filter(
            (id): id is string => typeof id === "string",
          )
          const add = addValueIds
            .map((vid) => optvalByValueId.get(vid))
            .filter((id): id is string => !!id)
          const remove = removeValueIds
            .map((vid) => optvalByValueId.get(vid))
            .filter((id): id is string => !!id)
          if (add.length || remove.length) {
            updates.push({
              product_id,
              product_option_id: attr.product_option_id as string,
              add,
              remove,
            })
          }
          for (const vid of addValueIds) {
            addLinks.push({
              [Modules.PRODUCT]: { product_id },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_value_id: vid,
              },
            })
          }
          for (const vid of removeValueIds) {
            dismissLinks.push({
              [Modules.PRODUCT]: { product_id },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_value_id: vid,
              },
            })
          }
        }
        return { updates, addLinks, dismissLinks }
      },
    )

    when(
      { subsetPlan },
      ({ subsetPlan }) => subsetPlan.updates.length > 0,
    ).then(() => updateProductOptionValuesOnProductStep(subsetPlan.updates))

    when(
      { subsetPlan },
      ({ subsetPlan }) => subsetPlan.dismissLinks.length > 0,
    ).then(() =>
      dismissRemoteLinkStep(subsetPlan.dismissLinks).config({
        name: "upd-pa-axis-dismiss-links",
      }),
    )

    when(
      { subsetPlan },
      ({ subsetPlan }) => subsetPlan.addLinks.length > 0,
    ).then(() =>
      createRemoteLinkStep(subsetPlan.addLinks).config({
        name: "upd-pa-axis-add-links",
      }),
    )

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
        for (const v of (productQuery.data?.product_attribute_values ?? []) as {
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
        const updateValueRows: { id: string; name: string }[] = []
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
            const linkedValueIds = linkedByAttr.get(ref.id) ?? []
            if (linkedValueIds.length > 0) {
              for (const vid of linkedValueIds) {
                updateValueRows.push({ id: vid, name: String(ref.value) })
              }
            } else {
              newValueRows.push({
                name: String(ref.value),
                attribute_id: ref.id,
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

        return { newValueRows, updateValueRows, toggleLinks, dismissLinks }
      },
    )

    const createdSwapValues = createProductAttributeValuesStep(
      swapPlan.newValueRows,
    )

    when(
      { swapPlan },
      ({ swapPlan }) => swapPlan.updateValueRows.length > 0,
    ).then(() =>
      updateProductAttributeValuesStep({ values: swapPlan.updateValueRows }),
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
            product_option_id: "",
            addValues: [] as CreateProductAttributeValueDTO[],
            removeIds: [] as string[],
            removeOptvalIds: [] as string[],
          }
        }
        const attr = attrsById.get(target.id) as ProductAttributeDTO
        const addValues = (target.add ?? [])
          .filter((a): a is { value: string } => typeof a !== "string")
          .map((a) => ({ name: a.value }))
        const valueById = new Map((attr.values ?? []).map((v) => [v.id, v]))
        const removeIds = (target.remove ?? []).filter((id) =>
          valueById.has(id),
        )
        // Medusa won't delete option values still associated with a product, so
        // these mirrored option values must be detached first.
        const removeOptvalIds = removeIds
          .map((id) => valueById.get(id)?.product_option_value_id)
          .filter((id): id is string => !!id)
        return {
          shouldAdd: addValues.length > 0,
          shouldRemove: removeIds.length > 0,
          attribute_id: target.id,
          product_option_id: attr.product_option_id as string,
          addValues,
          removeIds,
          removeOptvalIds,
        }
      },
    )

    const detached = when(
      { exclusivePlan },
      ({ exclusivePlan }) => exclusivePlan.shouldRemove,
    ).then(() =>
      detachProductOptionValuesFromProductStep({
        product_id: input.product_id,
        product_option_id: exclusivePlan.product_option_id,
        value_ids: exclusivePlan.removeOptvalIds,
      }),
    )

    const removeValueInput = transform(
      { exclusivePlan, detached },
      ({ exclusivePlan }) => ({ ids: exclusivePlan.removeIds }),
    )

    when(
      { exclusivePlan },
      ({ exclusivePlan }) => exclusivePlan.shouldRemove,
    ).then(() =>
      deleteProductAttributeValuesWorkflow.runAsStep({
        input: removeValueInput,
      }),
    )

    const exclusiveDismissLinks = transform(
      { input, exclusivePlan },
      ({ input, exclusivePlan }) =>
        exclusivePlan.removeIds.map((vid) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: vid,
          },
        })),
    )

    when(
      { exclusiveDismissLinks },
      ({ exclusiveDismissLinks }) => exclusiveDismissLinks.length > 0,
    ).then(() =>
      dismissRemoteLinkStep(exclusiveDismissLinks).config({
        name: "upd-pa-exclusive-dismiss-links",
      }),
    )

    const createdExclusiveValues = when(
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

    const exclusiveAddLinks = transform(
      { input, createdExclusiveValues },
      ({ input, createdExclusiveValues }) =>
        ((createdExclusiveValues ?? []) as { id: string }[]).map((v) => ({
          [Modules.PRODUCT]: { product_id: input.product_id },
          [MercurModules.PRODUCT_ATTRIBUTE]: {
            product_attribute_value_id: v.id,
          },
        })),
    )

    when(
      { exclusiveAddLinks },
      ({ exclusiveAddLinks }) => exclusiveAddLinks.length > 0,
    ).then(() =>
      createRemoteLinkStep(exclusiveAddLinks).config({
        name: "upd-pa-exclusive-add-links",
      }),
    )

    const renamePlan = transform(
      { input, attributesQuery },
      ({ input, attributesQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const renames = input.update.filter((ref) => {
          const attr = attrsById.get(ref.id)
          return (
            ref.title !== undefined &&
            ref.title.trim().length > 0 &&
            !!attr?.product_id
          )
        })
        const target = renames.length === 1 ? renames[0] : undefined
        return {
          should: !!target,
          id: target?.id ?? "",
          name: target?.title ?? "",
        }
      },
    )

    when({ renamePlan }, ({ renamePlan }) => renamePlan.should).then(() =>
      updateProductAttributesWorkflow.runAsStep({
        input: {
          selector: { id: renamePlan.id },
          update: { name: renamePlan.name },
        },
      }),
    )

    return new WorkflowResponse(void 0)
  },
)
