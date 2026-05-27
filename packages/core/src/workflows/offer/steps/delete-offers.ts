import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { MercurModules } from "@mercurjs/types"

import OfferModuleService from "../../../modules/offer/service"

export type DeleteOffersStepInput = {
  ids: string[]
  force?: boolean
}

/**
 * Bulk delete offers. With `force: false` (default) the rows are
 * soft-deleted (stamps `deleted_at`); with `force: true` the rows are
 * hard-deleted. The hard-delete branch is only used by the operator
 * termination flow and is invoked from `deleteOffersWorkflow` after
 * link teardown + bulk price removal so historical references resolve
 * cleanly.
 */
export const deleteOffersStep = createStep(
  "delete-offers",
  async (input: DeleteOffersStepInput, { container }) => {
    const ids = input.ids ?? []
    if (!ids.length) {
      return new StepResponse({ ids: [] as string[] }, {
        ids: [] as string[],
        force: !!input.force,
      })
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    if (input.force) {
      await service.deleteOffers(ids)
    } else {
      await service.softDeleteOffers(ids)
    }
    return new StepResponse({ ids }, { ids, force: !!input.force })
  },
  async (compensation, { container }) => {
    if (!compensation?.ids?.length) {
      return
    }
    if (compensation.force) {
      // Hard delete is irreversible; nothing to compensate.
      return
    }
    const service = container.resolve<OfferModuleService>(MercurModules.OFFER)
    await service.restoreOffers(compensation.ids)
  },
)
