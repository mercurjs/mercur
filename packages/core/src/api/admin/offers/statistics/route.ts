import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, IOfferModuleService, MercurModules } from "@mercurjs/types"

import { AdminGetOfferStatisticsParamsType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest<{}, HttpTypes.AdminOfferStatisticsParams>,
  res: MedusaResponse<HttpTypes.AdminOfferStatisticsResponse>
) => {
  const offerService = req.scope.resolve<IOfferModuleService>(
    MercurModules.OFFER
  )
  const { at, ...filters } =
    req.filterableFields as AdminGetOfferStatisticsParamsType

  const statistics = await offerService.getStatistics({ at, filters })

  res.json({ statistics })
}
