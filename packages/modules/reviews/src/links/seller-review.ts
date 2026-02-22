import { defineLink } from "@medusajs/framework/utils";

import ReviewModule from "../modules/reviews";
import { SellerModuleSellerLinkable } from "@mercurjs/framework";

export default defineLink(SellerModuleSellerLinkable, {
  linkable: ReviewModule.linkable.review,
  isList: true,
});
