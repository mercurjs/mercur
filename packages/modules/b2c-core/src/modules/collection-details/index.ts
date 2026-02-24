import { Module } from "@medusajs/framework/utils";

import CollectionDetailsModuleService from "./service";

export const COLLECTION_DETAILS_MODULE = "collection_details";

export default Module(COLLECTION_DETAILS_MODULE, {
    service: CollectionDetailsModuleService,
});
