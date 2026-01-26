import { z } from 'zod'

import { MedusaContainer } from '@medusajs/framework'
import {
  ContainerRegistrationKeys,
  arrayDifference,
} from '@medusajs/framework/utils'


import {
  AlgoliaProductValidator,
  AlgoliaVariantValidator
} from '@mercurjs/framework'

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

  let location_ids = []

  for (const variant of variants) {
    const inventory_items =
      variant.inventory_items?.map((item) => item.inventory) || []
    const locations = inventory_items
      .flatMap((inventory_item) => inventory_item.location_levels || [])
      .map((level) => level.location_id)

    location_ids = location_ids.concat(locations)
  }

  const { data: stock_locations } = await query.graph({
    entity: 'stock_location',
    fields: ['fulfillment_sets.service_zones.geo_zones.country_code'],
    filters: {
      id: location_ids
    }
  })

  let country_codes = []

  for (const location of stock_locations) {
    const fulfillmentSets =
      location.fulfillment_sets?.flatMap((set) => set.service_zones || []) || []
    const codes = fulfillmentSets
      .flatMap((sz) => sz.geo_zones || [])
      .map((gz) => gz.country_code)

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
    fields: ['seller.id', 'seller.handle', 'seller.store_status'],
    filters: {
      id: product_id
    }
  })

  return product && product.seller
    ? {
        id: product.seller.id,
        handle: product.seller.handle,
        store_status: product.seller.store_status
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
      'collection.title ',
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

  for (const product of products) {
    product.average_rating = 0
    product.supported_countries = await selectProductVariantsSupportedCountries(
      container,
      product.id
    )
    product.seller = await selectProductSeller(container, product.id)

    product.options = (product.options ?? [])
      .filter((option) => option?.title && option?.values)
      .map((option) => {
        return option.values.map((value) => {
          const entry = {}
          entry[option.title.toLowerCase()] = value.value
          return entry
        })
      })
      .flat()

    product.variants = z
      .array(AlgoliaVariantValidator)
      .parse(product.variants ?? [])
    product.variants = (product.variants ?? [])
      .map((variant) => {
        return (variant.options ?? []).reduce((entry, item) => {
          if (item?.option?.title) {
            entry[item.option.title.toLowerCase()] = item.value
          }
          return entry
        }, variant)
      })
      .flat()

    product.attribute_values = (product.attribute_values ?? [])
      .filter(
        (attrValue) =>
          attrValue && attrValue.attribute && attrValue.attribute.name
      )
      .map((attrValue) => {
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
