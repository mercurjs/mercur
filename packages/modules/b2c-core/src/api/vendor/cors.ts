import cors from 'cors'

import {
  ConfigModule,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse
} from '@medusajs/framework'
import { parseCorsOrigins } from '@medusajs/framework/utils'

export const vendorCors = (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) => {
  const configModule: ConfigModule = req.scope.resolve('configModule')

  return cors({
    // @ts-expect-error: vendorCors is not a valid config
    origin: parseCorsOrigins(configModule.projectConfig.http.vendorCors),
    credentials: true
  })(req, res, next)
}
