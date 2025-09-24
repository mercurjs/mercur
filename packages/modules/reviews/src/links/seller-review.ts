import { defineLink } from "@medusajs/framework/utils";

import ReviewModule from "../modules/reviews";

const linkable = {
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

export default defineLink(linkable, {
  linkable: ReviewModule.linkable.review,
  isList: true,
});
