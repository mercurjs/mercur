import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { HttpTypes } from "@medusajs/types";
import { AdminGetOrdersParamsType } from "./validators";

export declare const GET: (req: AuthenticatedMedusaRequest<AdminGetOrdersParamsType>, res: MedusaResponse<HttpTypes.AdminOrderListResponse>) => Promise<void>;
