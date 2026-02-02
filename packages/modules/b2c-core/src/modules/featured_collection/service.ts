import { MedusaService } from "@medusajs/framework/utils";
import { FeaturedCollection } from "./models/featured_collection";

class FeaturedCollectionModuleService extends MedusaService({
    FeaturedCollection,
}) { }

export default FeaturedCollectionModuleService;