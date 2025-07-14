import { MedusaService } from "@medusajs/framework/utils";

import { Review } from "./models/review";

/**
 * @class ReviewModuleService
 * @description Represents the review module service.
 */
class ReviewModuleService extends MedusaService({
  Review,
}) {}

export default ReviewModuleService;
