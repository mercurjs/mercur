export const adminSellerFields = [
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
  "payout_account.id",
  "payout_account.status",
  "payout_account.data",
  "payout_account.created_at",
  "payout_account.onboarding.id",
  "payout_account.onboarding.data",
]

export const adminSellerQueryConfig = {
  list: {
    defaults: adminSellerFields,
    isList: true,
  },
  retrieve: {
    defaults: adminSellerFields,
    isList: false,
  },
}
