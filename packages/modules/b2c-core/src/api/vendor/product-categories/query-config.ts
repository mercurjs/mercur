export const vendorProductCategoryFields = [
  'id',
  'name',
  'description',
  'handle',
  'rank',
  'parent_category_id',
  'created_at',
  'updated_at',
  'metadata',
  '*parent_category',
  '*category_children'
]

export const vendorProductCategoryQueryConfig = {
  list: {
    defaults: vendorProductCategoryFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductCategoryFields,
    isList: false
  }
}

export const vendorProductCategoryProductsFields = [
  'id',
  'title',
  'status',
  'thumbnail',
  'handle',
  'collection.id',
  'collection.title',
  'variants.id'
]
export const vendorProductCategoryProductsQueryConfig = {
  list: {
    defaults: vendorProductCategoryProductsFields,
    isList: true
  },
  retrieve: {
    defaults: vendorProductCategoryProductsFields,
    isList: false
  }
}
