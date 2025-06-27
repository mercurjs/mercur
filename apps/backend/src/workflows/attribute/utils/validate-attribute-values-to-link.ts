import {
  InferTypeOf,
  MedusaContainer,
  ProductCategoryDTO,
  ProductDTO
} from '@medusajs/framework/types'
import {
  ContainerRegistrationKeys,
  MedusaError,
  MedusaErrorTypes
} from '@medusajs/framework/utils'

import Attribute from '@mercurjs/attribute/src/models/attribute'
import { ProductAttributeValueDTO } from '@mercurjs/framework'

export const validateAttributeValuesToLink = async ({
  attributeValues,
  products,
  container
}: {
  attributeValues: ProductAttributeValueDTO[]
  products: ProductDTO[]
  container: MedusaContainer
}) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const attributeMap = new Map<
    string,
    InferTypeOf<typeof Attribute> & {
      product_categories?: ProductCategoryDTO[]
    }
  >()

  for (const attrVal of attributeValues) {
    const id = attrVal.attribute_id

    if (!attributeMap.get(id)) {
      const {
        data: [attribute]
      } = await query.graph({
        entity: 'attribute',
        fields: ['product_categories.*', 'possible_values.*'],
        filters: {
          id: id
        }
      })

      attributeMap.set(id, attribute)
    }

    const allowedValues = attributeMap
      .get(id)
      ?.possible_values?.map((posVal) => posVal.value)

    if (allowedValues?.length && !allowedValues.includes(attrVal.value)) {
      throw new MedusaError(
        MedusaErrorTypes.INVALID_DATA,
        `Attribute ${attrVal.attribute_id} doesn't define ${attrVal.value} as a possible_value`
      )
    }
  }

  const attributeCategoryIds = Array.from(
    new Set(
      Array.from(attributeMap.values()).flatMap(
        (attr) => attr.product_categories?.map((cat) => cat.id) || []
      )
    )
  )

  if (!attributeCategoryIds.length) {
    return
  }

  const invalidProductIds: string[] = []
  for (const product of products) {
    const productCategoryIds = product.categories?.map((cat) => cat.id)
    if (
      !productCategoryIds?.some((prodCatId) =>
        attributeCategoryIds.includes(prodCatId)
      )
    ) {
      invalidProductIds.push(product.id)
    }
  }

  if (invalidProductIds.length) {
    throw new MedusaError(
      MedusaErrorTypes.INVALID_DATA,
      `The following products aren't linked to any category from the requested attributes:\n${invalidProductIds.join(', ')}`
    )
  }
}
