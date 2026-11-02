export const adminStripeAccountQueryConfig = {
  retrieve: {
    defaults: ["*", "seller.id", "seller.name", "seller.handle", "seller.metadata"],
    isList: false,
  },
}
