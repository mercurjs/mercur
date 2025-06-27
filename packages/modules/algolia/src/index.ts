import { Module } from "@medusajs/framework/utils";

import AlgoliaModuleService from "./service";

export const ALGOLIA_MODULE = "algolia";
export { AlgoliaModuleService };
export { defaultProductSettings, defaultReviewSettings } from "./service";

export default Module(ALGOLIA_MODULE, {
  service: AlgoliaModuleService,
});
