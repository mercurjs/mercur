import { MedusaContainer } from '@medusajs/framework'
import { ProductDTO } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'

import { AttributeDTO } from '@mercurjs/framework'

import categoryAttribute from '../../../../links/category-attribute'

export type OptionMetadataInput = {
  title: string
  metadata: Record<string, unknown>
}

/**
 * Updates product option metadata directly via raw SQL.
 * This bypasses Medusa's service layer which doesn't properly support
 * metadata updates on product options.
 *
 * @param container - MedusaContainer
 * @param products - Products with options to update
 * @param optionsMetadata - Array of option titles with their metadata
 */
export const updateProductOptionsMetadata = async (
  container: MedusaContainer,
  products: ProductDTO[],
  optionsMetadata: OptionMetadataInput[] | undefined
): Promise<void> => {
  if (!optionsMetadata?.length) {
    return
  }

  const pgConnection = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

  const optionUpdates = products
    .flatMap((product) => product.options || [])
    .map((option) => ({
      optionId: option.id,
      metadata: optionsMetadata.find((om) => om.title === option.title)?.metadata
    }))
    .filter(
      (update): update is { optionId: string; metadata: Record<string, unknown> } =>
        !!update.metadata
    )

  if (!optionUpdates.length) {
    return
  }

  await Promise.all(
    optionUpdates.map(({ optionId, metadata }) =>
      pgConnection.raw(
        `UPDATE product_option SET metadata = ? WHERE id = ?`,
        [JSON.stringify(metadata), optionId]
      )
    )
  )
}

export const fetchProductDetails = async (
  product_id: string,
  scope: MedusaContainer
): Promise<ProductDTO> => {
  const service = scope.resolve(Modules.PRODUCT)
  const product = await service.retrieveProduct(product_id)
  return product
}

export async function getApplicableAttributes(
  container: MedusaContainer,
  product_id: string,
  fields: string[]
): Promise<AttributeDTO[]> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['categories.id'],
    filters: {
      id: product_id
    }
  })
  const categoryIds = product.categories.map((category) => category.id)

  const { data: attributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: ['attribute_id']
  })
  const attributeIds = attributes.map((attribute) => attribute.attribute_id)

  const { data: globalAttributes } = await query.graph({
    entity: 'attribute',
    fields: fields,
    filters: {
      id: {
        $nin: attributeIds
      },
      deleted_at: {
        $eq: null
      }
    }
  })

  const { data: categoryAttributes } = await query.graph({
    entity: categoryAttribute.entryPoint,
    fields: fields.map((field) => `attribute.${field}`),
    filters: {
      product_category_id: categoryIds,
      deleted_at: {
        $eq: null
      }
    }
  })

  return [
    ...globalAttributes,
    ...categoryAttributes.map((rel) => rel.attribute)
  ]
}
