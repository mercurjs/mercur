import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";

import { VendorRuleTypePathParam } from "../../../../api/vendor/promotions/validators";
import "./types";

export const vendorPromotionsRuleAttributeOptionsPathParamsGuard = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const result = VendorRuleTypePathParam.safeParse(req.params.rule_type);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid path parameters",
      details: result.error.errors,
    });
  }

  req.normalized_rule_type = result.data;

  try {
    req.params.rule_type = result.data;
  } catch {
    // req.params is frozen, normalized_rule_type will be used
  }

  next();
};
