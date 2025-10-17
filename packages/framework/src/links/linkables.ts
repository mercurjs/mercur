export const SellerModuleSellerLinkable = {
  toJSON: () => ({
    serviceName: "seller",
    field: "seller",
    linkable: "seller_id",
    primaryKey: "id",
  }),
  id: {
    linkable: "seller_id",
    primaryKey: "id",
    serviceName: "seller",
    field: "seller",
    entity: "Seller",
  },
};
