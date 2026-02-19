import { Module } from "@medusajs/framework/utils";

import ReviewModuleService from "./service";

export const REVIEW_MODULE = "reviews";

export * from "./types";
export { ReviewModuleService };

export default Module(REVIEW_MODULE, {
  service: ReviewModuleService,
});
