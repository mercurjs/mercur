import { MedusaService } from "@medusajs/framework/utils";

import { Request } from "./models";

/**
 * @class RequestsModuleService
 * @description Represents the requests module service.
 */
class RequestsModuleService extends MedusaService({
  Request,
}) {}

export default RequestsModuleService;
