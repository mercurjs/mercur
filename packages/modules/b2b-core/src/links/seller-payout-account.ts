import { defineLink } from "@medusajs/framework/utils";

import PayoutModule from "../modules/payout";
import SellerModule from "../modules/seller";

export default defineLink(
  SellerModule.linkable.seller,
  PayoutModule.linkable.payoutAccount
);
