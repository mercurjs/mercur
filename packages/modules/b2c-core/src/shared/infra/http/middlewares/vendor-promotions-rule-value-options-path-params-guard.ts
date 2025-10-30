import {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework";

import { VendorGetPromotionsRuleValuePathParams } from "../../../../api/vendor/promotions/validators";

export const vendorPromotionsRuleValueOptionsPathParamsGuard = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const result = VendorGetPromotionsRuleValuePathParams.safeParse(req.params);
  if (!result.success) {
    return res.status(400).json({
      error: "Invalid path parameters",
      details: result.error.errors,
    });
  }

  next();
};
