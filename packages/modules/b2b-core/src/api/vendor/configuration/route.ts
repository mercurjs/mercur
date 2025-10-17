import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

import { ConfigurationRuleDefaults } from "../../../modules/configuration";

/**
 * @oas [get] /vendor/configuration
 * operationId: "VendorListRules"
 * summary: "List rules"
 * description: "Retrieves marketplace rules list"
 * x-authenticated: true
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           type: object
 *           properties:
 *             configuration_rules:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/ConfigurationRule"
 * tags:
 *   - Vendor Configuration
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const rules = {};
  ConfigurationRuleDefaults.forEach((val, key) => {
    rules[key] = val;
  });

  const { data: configuration_rules } = await query.graph({
    entity: "configuration_rule",
    fields: ["rule_type", "is_enabled"],
  });

  configuration_rules.forEach(({ rule_type, is_enabled }) => {
    rules[rule_type] = is_enabled;
  });

  res.json({
    configuration_rules: rules,
  });
};
