export const storeSellerFields = [
  "id",
  "name",
  "handle",
  "logo",
  "cover_image",
  "address_1",
  "address_2",
  "city",
  "country_code",
  "province",
  "postal_code",
  "created_at",
  "updated_at",
]

export const storeSellerQueryConfig = {
  list: {
    defaults: storeSellerFields,
    allowed: storeSellerFields,
    isList: true,
  },
  retrieve: {
    defaults: storeSellerFields,
    allowed: storeSellerFields,
    isList: false,
  },
}
