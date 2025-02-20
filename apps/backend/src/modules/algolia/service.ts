import { Algoliasearch, IndexSettings, algoliasearch } from 'algoliasearch'

import { AlgoliaProduct, AlgoliaReview, IndexType } from './types'

export type ModuleOptions = {
  appId: string
  apiKey: string
}

export const defaultProductSettings: IndexSettings = {
  searchableAttributes: [
    'title',
    'subtitle',
    'brand.name',
    'tags.value',
    'type.value',
    'categories.name',
    'collection.title',
    'variants.title'
  ]
}

export const defaultReviewSettings: IndexSettings = {
  attributesForFaceting: ['filterOnly(reference_id)', 'filterOnly(reference)']
}

class AlgoliaModuleService {
  private options_: ModuleOptions
  private algolia_: Algoliasearch

  constructor(_, options: ModuleOptions) {
    this.options_ = options
    this.algolia_ = algoliasearch(this.options_.appId, this.options_.apiKey)
  }

  updateSettings(index: IndexType, settings: IndexSettings) {
    return this.algolia_.setSettings({
      indexName: index,
      indexSettings: settings
    })
  }

  upsertReview(review: AlgoliaReview) {
    return this.algolia_.addOrUpdateObject({
      indexName: IndexType.REVIEW,
      objectID: review.id,
      body: review
    })
  }

  deleteReview(id: string) {
    return this.algolia_.deleteObject({
      indexName: IndexType.REVIEW,
      objectID: id
    })
  }

  upsertProduct(product: AlgoliaProduct) {
    return this.algolia_.addOrUpdateObject({
      indexName: IndexType.PRODUCT,
      objectID: product.id,
      body: product
    })
  }

  deleteProduct(id: string) {
    return this.algolia_.deleteObject({
      indexName: IndexType.PRODUCT,
      objectID: id
    })
  }

  partialUpdateProduct(product: Partial<AlgoliaProduct> & { id: string }) {
    return this.algolia_.partialUpdateObject({
      indexName: IndexType.PRODUCT,
      objectID: product.id,
      attributesToUpdate: { ...product }
    })
  }

  batchUpsertProduct(products: AlgoliaProduct[]) {
    return this.algolia_.batch({
      indexName: IndexType.PRODUCT,
      batchWriteParams: {
        requests: products.map((product) => {
          return {
            action: 'addObject',
            objectID: product.id,
            body: product
          }
        })
      }
    })
  }

  batchDeleteProduct(ids: string[]) {
    return this.algolia_.batch({
      indexName: IndexType.PRODUCT,
      batchWriteParams: {
        requests: ids.map((id) => {
          return {
            action: 'deleteObject',
            objectID: id,
            body: {}
          }
        })
      }
    })
  }
}

export default AlgoliaModuleService
