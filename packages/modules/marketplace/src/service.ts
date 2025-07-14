import { MedusaService } from "@medusajs/framework/utils";

import { OrderSet } from "./models";

/**
 * @class MarketplaceModuleService
 * @description The marketplace module service.
 */
class MarketplaceModuleService extends MedusaService({
  OrderSet,
}) {}

export default MarketplaceModuleService;
