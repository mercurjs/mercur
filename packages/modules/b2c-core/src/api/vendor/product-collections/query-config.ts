export const vendorProductCollectionFields = [
  'id',
  'title',
  'handle',
  'created_at',
  'updated_at',
  'collection_detail.*',
  'collection_detail.media.id',
  'collection_detail.media.url',
  'collection_detail.media.alt_text',
  'metadata'
]

export const vendorProductCollectionQueryConfig = {
  list: {
    defaults: vendorProductCollectionFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductCollectionFields,
    isList: false
  }
}

export const vendorProductCollectionsProductsFields = [
  'id',
  'title',
  'status',
  'thumbnail',
  'handle',
  'collection.id',
  'collection.title',
  'variants.id'
]
export const vendorProductCollectionsProductsQueryConfig = {
  list: {
    defaults: vendorProductCollectionsProductsFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductCollectionsProductsFields,
    isList: false
  }
}
