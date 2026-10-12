import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { HttpTypes, ISellerModuleService, MercurModules } from "@mercurjs/types"

export const GET = async (
  req: AuthenticatedMedusaRequest<{}, {}>,
  res: MedusaResponse<HttpTypes.AdminSellerStatisticsResponse>
) => {
  const sellerService = req.scope.resolve<ISellerModuleService>(
    MercurModules.SELLER
  )

  const statistics = await sellerService.getStatistics()

  res.json({ statistics })
}
