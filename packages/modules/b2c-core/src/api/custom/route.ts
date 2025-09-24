import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";

import SellerModule from "../../modules/seller";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  console.log(SellerModule.linkable);
  res.json({ message: SellerModule.linkable.seller });
};
