import { Module } from "@medusajs/framework/utils";
import FeaturedCollectionModuleService from "./service";

export const FEATURED_COLLECTION_MODULE = "featured_collection";

export default Module(FEATURED_COLLECTION_MODULE, {
    service: FeaturedCollectionModuleService,
});