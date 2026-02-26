import {
  WorkflowResponse,
  createHook, createWorkflow
} from '@medusajs/workflows-sdk'

import { SellerEvents, UpdateSellerDTO } from '@mercurjs/framework'

import { updateSellerStep } from '../steps'
import { emitEventStep } from '@medusajs/medusa/core-flows'

export const updateSellerWorkflow = createWorkflow(
  'update-seller',
  function (input: UpdateSellerDTO) {
    const seller = updateSellerStep(input)

    const sellerUpdatedHook = createHook("sellerUpdated", {
      sellerId: seller.id,
    });

    emitEventStep({
      eventName: SellerEvents.SELLER_UPDATED,
      data: {
        ids: [seller.id],
      }
    })

    return new WorkflowResponse(seller, {
      hooks: [sellerUpdatedHook],
    });
  }
)
