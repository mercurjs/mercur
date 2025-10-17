export const storeWishlistFields = [
  'id',
  'title',
  'handle',
  'subtitle',
  'description',
  'is_giftcard',
  'status',
  'thumbnail',
  'weight',
  'length',
  'height',
  'width',
  'origin_country',
  'hs_code',
  'mid_code',
  'material',
  'discountable',
  'external_id',
  'metadata',
  'type_id',
  'type',
  'collection_id',
  'collection',
  'created_at',
  'updated_at',
  'deleted_at',
  'variant_id'
]

export const storeWishlistQueryConfig = {
  list: {
    defaults: storeWishlistFields,
    isList: true
  },
  retrieve: {
    defaults: storeWishlistFields,
    isList: false
  }
}
