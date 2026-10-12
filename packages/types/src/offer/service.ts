import { Context, IModuleService } from "@medusajs/types"
import { OfferStatisticsInput, OfferStatisticsOutput } from "./common"

export interface IOfferModuleService extends IModuleService {
  /**
   * Counts offers, and the distinct sellers and products behind them, as of `at`.
   *
   * @example
   * const { offers, sellers } = await offerModuleService.getStatistics({ at: new Date("2026-10-01") })
   */
  getStatistics(
    input?: OfferStatisticsInput,
    sharedContext?: Context
  ): Promise<OfferStatisticsOutput>
}
