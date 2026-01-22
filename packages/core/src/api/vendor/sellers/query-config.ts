export const vendorSellerFields = [
  "id",
  "name",
  "handle",
  "email",
  "phone",
  "logo",
  "cover_image",
  "address_1",
  "address_2",
  "city",
  "country_code",
  "province",
  "postal_code",
  "status",
  "created_at",
  "updated_at",
]

export const vendorSellerQueryConfig = {
  list: {
    defaults: vendorSellerFields,
    isList: true,
  },
  retrieve: {
    defaults: vendorSellerFields,
    isList: false,
  },
}
