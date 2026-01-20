import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";

import { VendorGetPromotionsRuleValuePathParams } from "../../../../api/vendor/promotions/validators";
import "./types";

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
  req.normalized_rule_type = result.data.rule_type;

  try {
    req.params.rule_type = result.data.rule_type;
  } catch {
    // req.params is frozen, normalized_rule_type will be used
  }

  next();
};
