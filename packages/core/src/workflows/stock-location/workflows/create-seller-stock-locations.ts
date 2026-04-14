import { createStockLocationsWorkflow } from "@medusajs/core-flows"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { linkSellerStockLocationStep } from "../steps"
import { CreateStockLocationInput } from "@medusajs/framework/types"

type CreateSellerStockLocationsWorkflowInput = {
  locations: CreateStockLocationInput[]
  seller_id: string
}

export const createSellerStockLocationsWorkflow = createWorkflow(
  "create-seller-stock-locations",
  function (input: CreateSellerStockLocationsWorkflowInput) {
    const createdStockLocations = createStockLocationsWorkflow.runAsStep({
      input: {
        locations: input.locations,
      },
    })

    const stockLocationIds = transform(
      createdStockLocations,
      (stockLocations) => stockLocations.map((sl) => sl.id)
    )

    linkSellerStockLocationStep({
      seller_id: input.seller_id,
      stock_location_ids: stockLocationIds,
    })

    return new WorkflowResponse(createdStockLocations)
  }
)
