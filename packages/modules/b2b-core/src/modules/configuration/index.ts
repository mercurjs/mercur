import { Module } from "@medusajs/framework/utils";

import ConfigurationModuleService from "./service";
import { ConfigurationRuleDefaults } from "@mercurjs/framework";

export const CONFIGURATION_MODULE = "configuration";
export { ConfigurationModuleService, ConfigurationRuleDefaults };

export default Module(CONFIGURATION_MODULE, {
  service: ConfigurationModuleService,
});
