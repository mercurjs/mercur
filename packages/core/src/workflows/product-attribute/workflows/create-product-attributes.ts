import { Modules } from "@medusajs/framework/utils"
import { AdditionalData, LinkDefinition } from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductAttributeDTO,
  MercurModules,
  ProductAttributeDTO,
} from "@mercurjs/types"

/**
 * Toggle attributes carry exactly two fixed values, seeded once here at
 * create time. Attaching a toggle to a product later resolves the boolean to
 * one of these existing values and links it — it never creates toggle values
 * (SPEC-014, confirmed 2026-06-18).
 */
export const TOGGLE_VALUE_NAMES = ["true", "false"] as const

import { ProductAttributeWorkflowEvents } from "../events"
import {
  createProductAttributeValuesStep,
  createProductAttributesStep,
  mirrorAxisAttributesToOptionsStep,
  validateProductAttributeInputStep,
} from "../steps"

export type CreateProductAttributesWorkflowInput = {
  attributes: (CreateProductAttributeDTO & {
    category_ids?: string[]
  })[]
} & AdditionalData

export type CreateProductAttributesWorkflowHooks = [
  Hook<"validate", { input: CreateProductAttributesWorkflowInput }, unknown>,
  Hook<
    "productAttributesCreated",
    {
      attributes: ProductAttributeDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createProductAttributesWorkflowId = "create-product-attributes"

export const createProductAttributesWorkflow: ReturnWorkflow<
  CreateProductAttributesWorkflowInput,
  ProductAttributeDTO[],
  CreateProductAttributesWorkflowHooks
> = createWorkflow(
  createProductAttributesWorkflowId,
  function (input: CreateProductAttributesWorkflowInput) {
    const validate = createHook("validate", { input })

    validateProductAttributeInputStep({ attributes: input.attributes })

    const attributesToCreate = transform({ input }, ({ input }) =>
      input.attributes.map((attr) => {
        const { category_ids: _category_ids, values: _values, ...rest } = attr
        return rest
      }),
    )

    const attributes = createProductAttributesStep(attributesToCreate)

    // Persist each attribute's `values[]` against the just-created ids.
    // The underlying create-attribute service doesn't accept inline
    // values, so they have to land via the values step.
    const valuesToCreate = transform(
      { input, attributes },
      ({ input, attributes }) => {
        const out: Array<{
          name: string
          handle?: string
          rank?: number
          is_active?: boolean
          metadata?: Record<string, unknown> | null
          attribute_id: string
        }> = []
        input.attributes.forEach((attr, idx) => {
          const attribute_id = attributes[idx]?.id
          if (!attribute_id) return
          // Toggle attributes always get the two fixed values, regardless of
          // what the caller sent — they are seeded once and never re-created.
          if (attr.type === AttributeType.TOGGLE) {
            TOGGLE_VALUE_NAMES.forEach((name, rank) =>
              out.push({ name, rank, attribute_id }),
            )
            return
          }
          for (const v of attr.values ?? []) {
            out.push({ ...v, attribute_id })
          }
        })
        return out
      },
    )

    createProductAttributeValuesStep(valuesToCreate)

    // SPEC-014: variant-axis attributes (multi_select only) are mirrored to a
    // shared native ProductOption. Build the mirror after values exist so the
    // option carries the same value set; persist the returned links.
    const axisMirrorInput = transform(
      { input, attributes },
      ({ input, attributes }) =>
        input.attributes
          .map((attr, idx) => ({ attr, id: attributes[idx]?.id }))
          .filter(
            ({ attr, id }) =>
              !!id &&
              attr.type === AttributeType.MULTI_SELECT &&
              !!attr.is_variant_axis,
          )
          .map(({ attr, id }) => ({
            attribute_id: id as string,
            title: attr.name,
            is_exclusive: false,
          })),
    )

    const axisMirror = mirrorAxisAttributesToOptionsStep(axisMirrorInput)

    createRemoteLinkStep(
      transform({ axisMirror }, ({ axisMirror }) => axisMirror.links),
    ).config({ name: "pa-create-axis-option-mirror-links" })

    const categoryLinks = transform(
      { input, attributes },
      ({ input, attributes }) => {
        const links: LinkDefinition[] = []
        input.attributes.forEach((attr, idx) => {
          for (const category_id of attr.category_ids ?? []) {
            links.push({
              [Modules.PRODUCT]: { product_category_id: category_id },
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_id: attributes[idx].id,
              },
            })
          }
        })
        return links
      },
    )

    createRemoteLinkStep(categoryLinks).config({
      name: "pa-create-category-links",
    })

    emitEventStep({
      eventName: ProductAttributeWorkflowEvents.CREATED,
      data: transform({ attributes }, ({ attributes }) =>
        attributes.map((a) => ({ id: a.id })),
      ),
    })

    const productAttributesCreated = createHook("productAttributesCreated", {
      attributes,
      additional_data: input.additional_data,
    })

    return new WorkflowResponse(attributes as ProductAttributeDTO[], {
      hooks: [validate, productAttributesCreated],
    })
  },
)
