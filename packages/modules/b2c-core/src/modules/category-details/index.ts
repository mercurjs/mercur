import { Module } from "@medusajs/framework/utils";

import CategoryDetailsModuleService from "./service";

export const CATEGORY_DETAILS_MODULE = "category_details";

export default Module(CATEGORY_DETAILS_MODULE, {
    service: CategoryDetailsModuleService,
});

