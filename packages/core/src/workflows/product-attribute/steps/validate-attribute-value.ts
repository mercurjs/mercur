import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes,
} from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

import { CreateProductAttributeValueDTO } from "@mercurjs/types"

import productAttributeValueLink from "../../../links/product-attribute-value-link"

export const validateAttributeValueStepId = "validate-attribute-value"

export const validateAttributeValueStep = createStep(
  validateAttributeValueStepId,
  async (input: CreateProductAttributeValueDTO, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const {
      data: [attribute],
    } = await query.graph({
      entity: "attribute",
      fields: ["product_categories.id", "possible_values.value"],
      filters: {
        id: input.attribute_id,
      },
    })

    const allowedValues = attribute.possible_values
      ?.filter((posVal: any) => posVal != null)
      .map((posVal: any) => posVal.value)

    if (allowedValues?.length && !allowedValues.includes(input.value)) {
      throw new MedusaError(
        MedusaErrorTypes.INVALID_DATA,
        `Attribute ${input.attribute_id} doesn't define ${input.value} as a possible_value`
      )
    }

    const attributeCategoryIds = attribute.product_categories.map(
      (cat: any) => cat.id
    )

    if (attributeCategoryIds.length) {
      const {
        data: [product],
      } = await query.graph({
        entity: "product",
        fields: ["categories.id"],
        filters: {
          id: input.product_id,
        },
      })

      const productCategoryIds = product.categories?.map(
        (cat: any) => cat.id
      )
      if (
        !productCategoryIds?.some((prodCatId: string) =>
          attributeCategoryIds.includes(prodCatId)
        )
      ) {
        throw new MedusaError(
          MedusaErrorTypes.INVALID_DATA,
          `Product ${input.product_id} isn't linked to any category from the requested attributes.`
        )
      }
    }

    const { data: attributeValuesProduct } = await query.graph({
      entity: productAttributeValueLink.entryPoint,
      fields: [
        "attribute_value.value",
        "attribute_value.attribute_id",
      ],
      filters: {
        product_id: input.product_id,
      },
    })

    const attributeValues = attributeValuesProduct
      .map((element: any) => element.attribute_value)
      .filter((value: any) => value != null)

    if (
      attributeValues.some(
        (value: any) =>
          value.attribute_id === input.attribute_id &&
          value.value === input.value
      )
    ) {
      throw new MedusaError(
        MedusaErrorTypes.DUPLICATE_ERROR,
        `Attribute value ${input.value} for attribute ${input.attribute_id} already exists for product ${input.product_id}`
      )
    }

    return new StepResponse()
  }
)
