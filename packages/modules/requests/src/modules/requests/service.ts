import { MedusaService } from "@medusajs/framework/utils";

import { Request } from "./models";

class RequestsModuleService extends MedusaService({
  Request,
}) {}

export default RequestsModuleService;
