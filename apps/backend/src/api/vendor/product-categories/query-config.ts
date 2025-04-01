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
