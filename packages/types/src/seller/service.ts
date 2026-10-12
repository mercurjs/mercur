import { Context, IModuleService } from "@medusajs/types"
import { SellerStatisticsInput, SellerStatisticsOutput } from "./common"

export interface ISellerModuleService extends IModuleService {
  /**
   * Counts sellers by status, plus premium sellers.
   *
   * @example
   * const { by_status } = await sellerModuleService.getStatistics()
   */
  getStatistics(
    input?: SellerStatisticsInput,
    sharedContext?: Context
  ): Promise<SellerStatisticsOutput>
}
