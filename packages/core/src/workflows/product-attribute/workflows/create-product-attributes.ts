import { Modules } from "@medusajs/framework/utils"
import {
  AdditionalData,
  LinkDefinition,
  ProductTypes,
} from "@medusajs/framework/types"
import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import {
  createProductOptionsStep,
  createRemoteLinkStep,
  emitEventStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  CreateProductAttributeDTO,
  CreateProductAttributeValueDTO,
  MercurModules,
  ProductAttributeDTO,
} from "@mercurjs/types"


import { ProductAttributeWorkflowEvents } from "../events"
import {
  createProductAttributesStep,
  createProductAttributeValuesStep,
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

    const optionsPlan = transform({ input }, ({ input }) => {
      const optionsToCreate: ProductTypes.CreateProductOptionDTO[] = []
      const attrIdxToOptionIdx: Record<number, number> = {}
      input.attributes.forEach((attr, idx) => {
        if (attr.type === AttributeType.MULTI_SELECT && attr.is_variant_axis) {
          attrIdxToOptionIdx[idx] = optionsToCreate.length
          optionsToCreate.push({
            title: attr.name,
            is_exclusive: false,
            values: (attr.values ?? []).map((v) => v.name),
          })
        }
      })
      return { optionsToCreate, attrIdxToOptionIdx }
    })

    const sharedOptions = createProductOptionsStep(optionsPlan.optionsToCreate)

    const attributesToCreate = transform(
      { input, optionsPlan, sharedOptions },
      ({ input, optionsPlan, sharedOptions }) =>
        input.attributes.map((attr, idx) => {
          const { category_ids: _category_ids, values: _values, ...rest } = attr
          const optionIdx = optionsPlan.attrIdxToOptionIdx[idx]
          if (optionIdx === undefined) {
            return rest
          }
          return { ...rest, product_option_id: sharedOptions[optionIdx].id }
        }),
    )

    const attributes = createProductAttributesStep(attributesToCreate)

    const valueInputs = transform(
      { input, attributes, optionsPlan, sharedOptions },
      ({ input, attributes, optionsPlan, sharedOptions }) => {
        const valuesToCreate: (CreateProductAttributeValueDTO & {
          attribute_id: string
        })[] = []

        input.attributes.forEach((attr, idx) => {
          const optionIdx = optionsPlan.attrIdxToOptionIdx[idx]
          const idByValue = new Map<string, string>(
            optionIdx === undefined
              ? []
              : (sharedOptions[optionIdx].values ?? []).map((ov) => [
                  ov.value,
                  ov.id,
                ]),
          )

          for (const value of attr.values ?? []) {
            valuesToCreate.push({
              ...value,
              attribute_id: attributes[idx].id,
              product_option_value_id: idByValue.get(value.name) ?? null,
            })
          }
        })

        return valuesToCreate
      },
    )

    createProductAttributeValuesStep(valueInputs)

    const categoryLinks = transform(
      { input, attributes },
      ({ input, attributes }) => {
        const links: LinkDefinition[] = []
        input.attributes.forEach((attr, idx) => {
          for (const category_id of attr.category_ids ?? []) {
            links.push({
              [MercurModules.PRODUCT_ATTRIBUTE]: {
                product_attribute_id: attributes[idx].id,
              },
              [Modules.PRODUCT]: { product_category_id: category_id },
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
