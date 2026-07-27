import { AdditionalData } from "@medusajs/framework/types"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  updateProductOptionsStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import {
  AttributeType,
  MercurModules,
  ProductAttributeValueDTO,
  UpsertProductAttributeValueDTO,
} from "@mercurjs/types"

import type ProductAttributeModuleService from "../../../modules/product-attribute/service"

export type UpsertProductAttributeValuesWorkflowInput = {
  attribute_id: string
  values: UpsertProductAttributeValueDTO[]
} & AdditionalData

const upsertProductAttributeValuesStepId = "pa-upsert-product-attribute-values"

type UpsertStepInput = (UpsertProductAttributeValueDTO & {
  attribute_id: string
})[]

const upsertProductAttributeValuesStep = createStep(
  upsertProductAttributeValuesStepId,
  async (data: UpsertStepInput, { container }) => {
    const service = container.resolve<ProductAttributeModuleService>(
      MercurModules.PRODUCT_ATTRIBUTE,
    )
    const toCreate = data.filter((v) => !v.id)
    const toUpdate = data.filter((v) => !!v.id)

    const created = toCreate.length
      ? await service.createProductAttributeValues(toCreate)
      : []
    const updated = toUpdate.length
      ? await service.updateProductAttributeValues(toUpdate)
      : []

    return new StepResponse([...created, ...updated])
  },
)

export const upsertProductAttributeValuesWorkflowId =
  "upsert-product-attribute-values"

export const upsertProductAttributeValuesWorkflow = createWorkflow(
  upsertProductAttributeValuesWorkflowId,
  function (input: UpsertProductAttributeValuesWorkflowInput) {
    const attributeQuery = useQueryGraphStep({
      entity: "product_attribute",
      filters: { id: input.attribute_id },
      fields: [
        "id",
        "name",
        "type",
        "is_variant_axis",
        "product_option_id",
        "values.name",
      ],
      options: { isList: false },
    })

    // Global variant-axis attributes back a shared Medusa ProductOption. Values
    // added or renamed through this endpoint must be mirrored onto it, otherwise
    // variant create fails with "Option value X does not exist for option Y".
    const mirroredOption = when({ attributeQuery }, ({ attributeQuery }) => {
      const attribute = attributeQuery.data
      return (
        attribute?.type === AttributeType.MULTI_SELECT &&
        !!attribute?.is_variant_axis &&
        !!attribute?.product_option_id
      )
    }).then(() => {
      const optionUpdate = transform(
        { attributeQuery, input },
        ({ attributeQuery, input }) => {
          const attribute = attributeQuery.data
          const existing = (attribute.values ?? []).map(
            (v: { name: string }) => v.name,
          )
          const incoming = input.values
            .map((v) => v.name)
            .filter((name): name is string => !!name)
          return {
            selector: { id: attribute.product_option_id },
            update: { values: Array.from(new Set([...existing, ...incoming])) },
          }
        },
      )

      return updateProductOptionsStep(optionUpdate)
    })

    const rows = transform(
      { input, mirroredOption },
      ({ input, mirroredOption }) => {
        const option = mirroredOption?.[0]
        const idByValue = new Map<string, string>(
          (option?.values ?? []).map((ov: { id: string; value: string }) => [
            ov.value,
            ov.id,
          ]),
        )
        return input.values.map((v) => {
          const product_option_value_id = v.name
            ? idByValue.get(v.name)
            : undefined
          return {
            ...v,
            attribute_id: input.attribute_id,
            ...(product_option_value_id ? { product_option_value_id } : {}),
          }
        })
      },
    )

    const values = upsertProductAttributeValuesStep(rows)

    return new WorkflowResponse(values as ProductAttributeValueDTO[])
  },
)
