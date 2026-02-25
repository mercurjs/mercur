import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  arrayDifference,
} from '@medusajs/framework/utils'

import {
  AlgoliaProductValidator,
  AlgoliaVariantValidator
} from '../../modules/algolia/types'

async function selectProductVariantsSupportedCountries(
  container: MedusaContainer,
  product_id: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: variants } = await query.graph({
    entity: 'product_variant',
    fields: ['inventory_items.inventory.location_levels.location_id'],
    filters: {
      product_id
    }
  })

  let location_ids: string[] = []

  for (const variant of variants) {
    const inventory_items =
      (variant as any).inventory_items?.map((item: any) => item.inventory) || []
    const locations = inventory_items
      .flatMap((inventory_item: any) => inventory_item.location_levels || [])
      .map((level: any) => level.location_id)

    location_ids = location_ids.concat(locations)
  }

  const { data: stock_locations } = await query.graph({
    entity: 'stock_location',
    fields: ['fulfillment_sets.service_zones.geo_zones.country_code'],
    filters: {
      id: location_ids
    }
  })

  let country_codes: string[] = []

  for (const location of stock_locations) {
    const fulfillmentSets =
      (location as any).fulfillment_sets?.flatMap((set: any) => set.service_zones || []) || []
    const codes = fulfillmentSets
      .flatMap((sz: any) => sz.geo_zones || [])
      .map((gz: any) => gz.country_code)

    country_codes = country_codes.concat(codes)
  }

  return [...new Set(country_codes)]
}

async function selectProductSeller(
  container: MedusaContainer,
  product_id: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [product]
  } = await query.graph({
    entity: 'product',
    fields: ['seller.id', 'seller.handle', 'seller.status'],
    filters: {
      id: product_id
    }
  })



  const p = product as any
  return p?.seller?.id
    ? {
        id: p.seller.id as string,
        handle: p.seller.handle as string | null,
        status: p.seller.status as string | null
      }
    : null
}

export async function filterProductsByStatus(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: ['id', 'status'],
    filters: {
      id: ids
    }
  })

  const published = products.filter((p) => p.status === 'published')
  const notPublished = arrayDifference(products, published)

  const existingIds = new Set(products.map((p) => p.id))

  const deletedIds = ids.filter((id) => !existingIds.has(id))

  return {
    published: published.map((p) => p.id),
    other: [...notPublished.map((p) => p.id), ...deletedIds]
  }
}

export async function findAndTransformAlgoliaProducts(
  container: MedusaContainer,
  ids: string[] = []
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: products } = await query.graph({
    entity: 'product',
    fields: [
      '*',
      'categories.name',
      'categories.id',
      'collection.title',
      'tags.value',
      'type.value',
      'variants.*',
      'variants.options.*',
      'variants.options.prices.*',
      'variants.prices.*',
      'options.*',
      'options.values.*',
      'images.*',
      'attribute_values.value',
      'attribute_values.attribute.name',
      'attribute_values.attribute.is_filterable',
      'attribute_values.attribute.ui_component'
    ],
    filters: ids.length
      ? {
          id: ids,
          status: 'published'
        }
      : { status: 'published' }
  })

  for (const product of products as any[]) {
    product.average_rating = 0
    product.supported_countries = await selectProductVariantsSupportedCountries(
      container,
      product.id
    )
    product.seller = await selectProductSeller(container, product.id)

    product.options = (product.options ?? [])
      .filter((option: any) => option?.title && option?.values)
      .map((option: any) => {
        return option.values.map((value: any) => {
          const entry: Record<string, string> = {}
          entry[option.title.toLowerCase()] = value.value
          return entry
        })
      })
      .flat()

    product.variants = z
      .array(AlgoliaVariantValidator)
      .parse(product.variants ?? [])
    product.variants = (product.variants ?? [])
      .map((variant: any) => {
        return (variant.options ?? []).reduce((entry: any, item: any) => {
          if (item?.option?.title) {
            entry[item.option.title.toLowerCase()] = item.value
          }
          return entry
        }, variant)
      })
      .flat()

    product.attribute_values = (product.attribute_values ?? [])
      .filter(
        (attrValue: any) =>
          attrValue && attrValue.attribute && attrValue.attribute.name
      )
      .map((attrValue: any) => {
        return {
          name: attrValue.attribute.name,
          value: attrValue.value,
          is_filterable: attrValue.attribute.is_filterable,
          ui_component: attrValue.attribute.ui_component
        }
      })
  }

  return z.array(AlgoliaProductValidator).parse(products)
}
