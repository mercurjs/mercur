import { Algoliasearch, algoliasearch } from 'algoliasearch'

import { AlgoliaProduct, IndexType } from './types'

export type ModuleOptions = {
  appId: string
  apiKey: string
}

class AlgoliaModuleService {
  private options_: ModuleOptions
  private algolia_: Algoliasearch

  constructor(_, options: ModuleOptions) {
    this.options_ = options
    this.algolia_ = algoliasearch(this.options_.appId, this.options_.apiKey)
  }

  upsertProduct(product: AlgoliaProduct) {
    return this.algolia_.addOrUpdateObject({
      indexName: IndexType.PRODUCT,
      objectID: product.id,
      body: product
    })
  }

  batchInsertProduct(products: AlgoliaProduct[]) {
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
}

export default AlgoliaModuleService
