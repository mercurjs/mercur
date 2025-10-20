import { MedusaService } from "@medusajs/framework/utils";
import { SecondaryCategory } from "./models/secondary_category";

class SecondaryCategoryModuleService extends MedusaService({
  SecondaryCategory,
}) {}

export default SecondaryCategoryModuleService;
