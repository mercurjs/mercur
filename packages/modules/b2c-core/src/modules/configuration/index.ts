import { Module } from "@medusajs/framework/utils";

import ConfigurationModuleService, {
  ConfigurationRuleDefaults,
} from "./service";

export const CONFIGURATION_MODULE = "configuration";
export { ConfigurationModuleService, ConfigurationRuleDefaults };

export default Module(CONFIGURATION_MODULE, {
  service: ConfigurationModuleService,
});
