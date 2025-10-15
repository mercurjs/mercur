import { defineLink } from "@medusajs/framework/utils";

import RequestsModule from "../modules/requests";
import { SellerModuleSellerLinkable } from "@mercurjs/framework";

export default defineLink(SellerModuleSellerLinkable, {
  linkable: RequestsModule.linkable.request,
  isList: true,
});
