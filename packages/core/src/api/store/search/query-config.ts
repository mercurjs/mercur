export const defaultStoreSearchFields = [
  "id",
  "product_id",
  "title",
  "handle",
  "description",
  "thumbnail",
  "status",
  "collection_id",
  "type_id",
  "category_ids",
  "tag_ids",
  "seller_ids",
  "attributes",
  "metadata",
  "calculated_price",
]

export const storeSearchQueryConfig = {
  list: {
    defaults: defaultStoreSearchFields,
    defaultLimit: 20,
    isList: true,
  },
}
