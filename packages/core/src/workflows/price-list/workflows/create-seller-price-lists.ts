import { createPriceListsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreatePriceListWorkflowInputDTO } from "@medusajs/framework/types"

import { linkSellerPriceListStep } from "../steps"

type CreateSellerPriceListsWorkflowInput = {
  price_lists_data: CreatePriceListWorkflowInputDTO[]
  seller_id: string
}

export const createSellerPriceListsWorkflow = createWorkflow(
  "create-seller-price-lists",
  function (input: CreateSellerPriceListsWorkflowInput) {
    const createdPriceLists = createPriceListsWorkflow.runAsStep({
      input: {
        price_lists_data: input.price_lists_data,
      },
    })

    const priceListIds = transform(createdPriceLists, (priceLists) =>
      priceLists.map((pl) => pl.id)
    )

    linkSellerPriceListStep({
      seller_id: input.seller_id,
      price_list_ids: priceListIds,
    })

    return new WorkflowResponse(createdPriceLists)
  }
)
