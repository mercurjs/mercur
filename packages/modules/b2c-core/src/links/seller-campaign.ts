import { defineLink } from "@medusajs/framework/utils";
import PromotionModule from "@medusajs/medusa/promotion";

import SellerModule from "../modules/seller";

export default defineLink(
  {
    linkable: SellerModule.linkable.seller,
    filterable: ["id"],
  },
  {
    linkable: PromotionModule.linkable.campaign,
    isList: true,
    filterable: ["id", "name", "campaign_identifier", "deleted_at"],
  }
);