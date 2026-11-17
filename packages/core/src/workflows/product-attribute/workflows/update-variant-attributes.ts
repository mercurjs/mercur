import { AdditionalData } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"
import {
  AttributeScope,
  AttributeType,
  CreateProductAttributeValueDTO,
  ProductAttributeDTO,
  VariantAttributeBatchInput,
} from "@mercurjs/types"

import {
  createProductAttributeValuesStep,
  createProductVariantAttributeValuesStep,
  deleteProductAttributeValuesStep,
  deleteProductVariantAttributeValuesStep,
  SCALAR_VALUE_TYPES,
  updateProductAttributeValuesStep,
  validateProductAttributesNotRequiredStep,
  validateProductAttributesScopeStep,
  validateProductAttributeValuesStep,
} from "../steps"

export type UpdateVariantAttributesWorkflowInput = VariantAttributeBatchInput &
  AdditionalData

export type UpdateVariantAttributesWorkflowHooks = [
  Hook<"validate", { input: UpdateVariantAttributesWorkflowInput }, unknown>,
  Hook<
    "variantAttributesLinked",
    {
      product_id: string
      variant_id: string
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const updateVariantAttributesWorkflowId = "update-variant-attributes"

type JoinRow = {
  id: string
  value_id: string
  value?: { id: string; name: string; attribute_id: string } | null
}

const SELECT_TYPES: AttributeType[] = [
  AttributeType.SINGLE_SELECT,
  AttributeType.MULTI_SELECT,
]

/**
 * Applies a remove → add → update attribute batch to a single product variant.
 * Mirrors `createAndLinkProductAttributesToProductWorkflow`, but variant
 * attributes are always shared catalog attributes with `scope: "variant"`, so
 * there is no inline creation and no axis handling: select and toggle values
 * are attached through `product_variant_attribute_value` join rows and scalar
 * types (`text` / `unit` / `date`) get one value row per variant.
 */
export const updateVariantAttributesWorkflow: ReturnWorkflow<
  UpdateVariantAttributesWorkflowInput,
  void,
  UpdateVariantAttributesWorkflowHooks
> = createWorkflow(
  updateVariantAttributesWorkflowId,
  function (input: UpdateVariantAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    const requestedIds = transform({ input }, ({ input }) =>
      Array.from(
        new Set([
          ...(input.add ?? []).map((ref) => ref.id),
          ...(input.update ?? []).map((ref) => ref.id),
          ...(input.remove ?? []),
        ]),
      ),
    )

    const attributesQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: requestedIds },
      fields: [
        "id",
        "name",
        "type",
        "scope",
        "is_required",
        "validation",
        "values.id",
        "values.name",
      ],
    }).config({ name: "upd-va-attributes" })

    validateProductAttributesScopeStep(
      transform(
        { requestedIds, attributesQuery },
        ({ requestedIds, attributesQuery }) => ({
          expected: AttributeScope.VARIANT,
          requested_ids: requestedIds,
          attributes: ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map(
            (a) => ({ id: a.id, name: a.name, scope: a.scope }),
          ),
        }),
      ),
    )

    validateProductAttributesNotRequiredStep(
      transform({ input, attributesQuery }, ({ input, attributesQuery }) => {
        const readd = new Set((input.add ?? []).map((ref) => ref.id))
        const remove = new Set(input.remove ?? [])
        return ((attributesQuery.data ?? []) as ProductAttributeDTO[])
          .filter((a) => remove.has(a.id) && !readd.has(a.id))
          .map((a) => ({ id: a.id, name: a.name, is_required: !!a.is_required }))
      }),
    )

    validateProductAttributeValuesStep(
      transform({ input, attributesQuery }, ({ input, attributesQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        return [...(input.add ?? []), ...(input.update ?? [])].flatMap((ref) => {
          const attr = attrsById.get(ref.id)
          if (
            ref.value === undefined ||
            !attr ||
            !SCALAR_VALUE_TYPES.includes(attr.type)
          ) {
            return []
          }
          return [
            {
              name: attr.name,
              type: attr.type,
              validation: attr.validation,
              value: ref.value,
            },
          ]
        })
      }),
    )

    const currentQuery = useQueryGraphStep({
      entity: "product_variant_attribute_value",
      filters: { variant_id: input.variant_id },
      fields: ["id", "value_id", "value.id", "value.name", "value.attribute_id"],
    }).config({ name: "upd-va-current" })

    const plan = transform(
      { input, attributesQuery, currentQuery },
      ({ input, attributesQuery, currentQuery }) => {
        const attrsById = new Map(
          ((attributesQuery.data ?? []) as ProductAttributeDTO[]).map((a) => [
            a.id,
            a,
          ]),
        )
        const current = ((currentQuery.data ?? []) as JoinRow[]).filter(
          (row) => row.value?.attribute_id,
        )

        const heldByAttr = new Map<string, { join_id: string; value_id: string; name: string }[]>()
        for (const row of current) {
          const attributeId = row.value!.attribute_id
          const list = heldByAttr.get(attributeId) ?? []
          list.push({ join_id: row.id, value_id: row.value_id, name: row.value!.name })
          heldByAttr.set(attributeId, list)
        }

        const deleteJoinIds = new Set<string>()
        const deleteValueIds = new Set<string>()
        const attachValueIds = new Set<string>()
        const newValueRows: (CreateProductAttributeValueDTO & {
          attribute_id: string
        })[] = []
        const renameValueRows: { id: string; name: string }[] = []

        const detachAll = (attributeId: string, dropScalarRows: boolean) => {
          for (const held of heldByAttr.get(attributeId) ?? []) {
            deleteJoinIds.add(held.join_id)
            if (dropScalarRows) {
              deleteValueIds.add(held.value_id)
            }
          }
          heldByAttr.set(attributeId, [])
        }

        for (const attributeId of input.remove ?? []) {
          const attr = attrsById.get(attributeId)
          if (!attr) continue
          detachAll(attributeId, SCALAR_VALUE_TYPES.includes(attr.type))
        }

        const setSelection = (attributeId: string, desired: string[]) => {
          const held = heldByAttr.get(attributeId) ?? []
          const desiredSet = new Set(desired)
          for (const h of held) {
            if (!desiredSet.has(h.value_id)) {
              deleteJoinIds.add(h.join_id)
            }
          }
          const heldIds = new Set(held.map((h) => h.value_id))
          for (const id of desired) {
            if (!heldIds.has(id)) {
              attachValueIds.add(id)
            }
          }
          heldByAttr.set(
            attributeId,
            held
              .filter((h) => desiredSet.has(h.value_id))
              .concat(
                desired
                  .filter((id) => !heldIds.has(id))
                  .map((id) => ({ join_id: "", value_id: id, name: "" })),
              ),
          )
        }

        const applyScalar = (attr: ProductAttributeDTO, value: unknown) => {
          const name = String(value)
          const held = heldByAttr.get(attr.id) ?? []
          if (held.length > 0) {
            for (const h of held) {
              if (h.name !== name) {
                renameValueRows.push({ id: h.value_id, name })
              }
            }
            return
          }
          newValueRows.push({ name, attribute_id: attr.id })
        }

        const applyToggle = (attr: ProductAttributeDTO, value: unknown) => {
          const seeded = (attr.values ?? []).find((v) => v.name === String(value))
          setSelection(attr.id, seeded ? [seeded.id] : [])
        }

        for (const ref of input.add ?? []) {
          const attr = attrsById.get(ref.id)
          if (!attr) continue
          if (SELECT_TYPES.includes(attr.type)) {
            if (ref.value_ids) {
              const allowed = new Set((attr.values ?? []).map((v) => v.id))
              setSelection(
                attr.id,
                ref.value_ids.filter((id) => allowed.has(id)),
              )
            }
          } else if (attr.type === AttributeType.TOGGLE) {
            if (ref.value !== undefined) applyToggle(attr, ref.value)
          } else if (ref.value !== undefined) {
            applyScalar(attr, ref.value)
          }
        }

        for (const ref of input.update ?? []) {
          const attr = attrsById.get(ref.id)
          if (!attr) continue
          if (SELECT_TYPES.includes(attr.type)) {
            const allowed = new Set((attr.values ?? []).map((v) => v.id))
            const held = (heldByAttr.get(attr.id) ?? []).map((h) => h.value_id)
            let desired: string[] | undefined
            if (ref.value_ids) {
              desired = ref.value_ids
            } else if (ref.add || ref.remove) {
              const removeSet = new Set(ref.remove ?? [])
              const adds = (ref.add ?? []).filter(
                (a): a is string => typeof a === "string",
              )
              desired = Array.from(
                new Set([...held.filter((id) => !removeSet.has(id)), ...adds]),
              )
            }
            if (desired) {
              setSelection(
                attr.id,
                desired.filter((id) => allowed.has(id)),
              )
            }
          } else if (attr.type === AttributeType.TOGGLE) {
            if (ref.value !== undefined) applyToggle(attr, ref.value)
          } else if (ref.value !== undefined) {
            applyScalar(attr, ref.value)
          }
        }

        return {
          deleteJoinIds: Array.from(deleteJoinIds),
          deleteValueIds: Array.from(deleteValueIds),
          attachValueIds: Array.from(attachValueIds),
          newValueRows,
          renameValueRows,
        }
      },
    )

    when({ plan }, ({ plan }) => plan.deleteJoinIds.length > 0).then(() =>
      deleteProductVariantAttributeValuesStep(plan.deleteJoinIds),
    )

    when({ plan }, ({ plan }) => plan.deleteValueIds.length > 0).then(() =>
      deleteProductAttributeValuesStep(plan.deleteValueIds),
    )

    when({ plan }, ({ plan }) => plan.renameValueRows.length > 0).then(() =>
      updateProductAttributeValuesStep({ values: plan.renameValueRows }),
    )

    const createdValues = createProductAttributeValuesStep(plan.newValueRows)

    const joinRows = transform(
      { input, plan, createdValues },
      ({ input, plan, createdValues }) => [
        ...plan.attachValueIds.map((value_id) => ({
          variant_id: input.variant_id,
          value_id,
        })),
        ...((createdValues ?? []) as { id: string }[]).map((v) => ({
          variant_id: input.variant_id,
          value_id: v.id,
        })),
      ],
    )

    when({ joinRows }, ({ joinRows }) => joinRows.length > 0).then(() =>
      createProductVariantAttributeValuesStep(joinRows),
    )

    const variantAttributesLinked = createHook("variantAttributesLinked", {
      product_id: input.product_id,
      variant_id: input.variant_id,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(void 0, {
      hooks: [validate, variantAttributesLinked],
    })
  },
)
