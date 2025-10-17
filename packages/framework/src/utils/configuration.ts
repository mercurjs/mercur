import { MedusaContainer } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { ConfigurationRuleType } from "../types";

export const ConfigurationRuleDefaults = new Map<
  ConfigurationRuleType,
  boolean
>([
  [ConfigurationRuleType.GLOBAL_PRODUCT_CATALOG, false],
  [ConfigurationRuleType.PRODUCT_REQUEST_ENABLED, true],
  [ConfigurationRuleType.REQUIRE_PRODUCT_APPROVAL, false],
  [ConfigurationRuleType.PRODUCT_IMPORT_ENABLED, true],
]);

export const checkConfigurationRule = async (
  scope: MedusaContainer,
  ruleType: ConfigurationRuleType
): Promise<boolean> => {
  const logger = scope.resolve(ContainerRegistrationKeys.LOGGER);
  const query = scope.resolve(ContainerRegistrationKeys.QUERY);

  let enabled = ConfigurationRuleDefaults.get(ruleType) || false;

  try {
    const {
      data: [rule],
    } = await query.graph({
      entity: "configuration_rule",
      fields: ["is_enabled"],
      filters: {
        rule_type: ruleType,
      },
    });

    enabled = rule.is_enabled;
  } catch (error) {
    logger.error(`Error checking configuration rule ${ruleType}: ${error}`);
  }

  return enabled;
};
