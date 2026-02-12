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

  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

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

  const dedupedOptionUpdates = Array.from(
    new Map(optionUpdates.map((update) => [update.optionId, update])).values()
  )

  if (!dedupedOptionUpdates.length) {
    return
  }

  const caseClauses = dedupedOptionUpdates
    .map(() => 'WHEN id = ? THEN ?::jsonb')
    .join(' ')
  const wherePlaceholders = dedupedOptionUpdates.map(() => '?').join(', ')

  const bindings = [
    ...dedupedOptionUpdates.flatMap(({ optionId, metadata }) => [
      optionId,
      JSON.stringify(metadata)
    ]),
    ...dedupedOptionUpdates.map(({ optionId }) => optionId)
  ]

  await knex.raw(
    `
      UPDATE product_option
      SET metadata = CASE
        ${caseClauses}
        ELSE metadata
      END
      WHERE id IN (${wherePlaceholders})
    `,
    bindings
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
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION)

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

  // Fetch global attributes (not assigned to any category) without scanning all links.
  // We do this using a LEFT JOIN against the category-attribute link table filtered to non-deleted links.
  const linkSubquery = knex(categoryAttribute.entryPoint)
    .select('attribute_id')
    .whereNull('deleted_at')
    .groupBy('attribute_id')

  const globalAttributeIdRows: { id: string }[] = await knex(
    'attribute as a'
  )
    .select('a.id')
    .leftJoin(linkSubquery.as('link'), 'link.attribute_id', 'a.id')
    .whereNull('a.deleted_at')
    .whereNull('link.attribute_id')

  const globalAttributeIds = globalAttributeIdRows.map((row) => row.id)

  const globalAttributes =
    globalAttributeIds.length > 0
      ? (
        await query.graph({
          entity: 'attribute',
          fields,
          filters: {
            id: globalAttributeIds,
            deleted_at: {
              $eq: null
            }
          }
        })
      ).data
      : []

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
