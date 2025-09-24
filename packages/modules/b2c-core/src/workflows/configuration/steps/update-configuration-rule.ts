import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk";

import {
  CONFIGURATION_MODULE,
  ConfigurationModuleService,
} from "../../../modules/configuration";
import { UpdateConfigurationRuleDTO } from "@mercurjs/framework";

export const updateConfigurationRuleStep = createStep(
  "update-configuration-rule",
  async (input: UpdateConfigurationRuleDTO, { container }) => {
    const service =
      container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE);

    const configuration_rule = await service.updateConfigurationRules(input);

    return new StepResponse(configuration_rule, configuration_rule.id);
  }
);
