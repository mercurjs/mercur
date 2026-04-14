import {
  ConfigModule,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { parseCorsOrigins } from "@medusajs/framework/utils"
import cors from "cors"

export const vendorCorsMiddleware = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const configModule: ConfigModule = req.scope.resolve("configModule")
  return cors({
    // @ts-expect-error: vendorCors is not defined in the medusa http config module
    origin: parseCorsOrigins(configModule.projectConfig.http.vendorCors),
    credentials: true,
  })(req, res, next)
}
