import { defineLink } from "@medusajs/framework/utils";

import orderReturnRequest from "../modules/order-return-request";
import { SellerModuleSellerLinkable } from "@mercurjs/framework";

export default defineLink(SellerModuleSellerLinkable, {
  linkable: orderReturnRequest.linkable.orderReturnRequest,
  isList: true,
});
