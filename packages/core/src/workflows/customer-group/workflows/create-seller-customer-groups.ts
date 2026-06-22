import { createCustomerGroupsWorkflow } from "@medusajs/core-flows"
import { CreateCustomerGroupDTO } from "@medusajs/framework/types"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"

import { linkSellerCustomerGroupStep } from "../steps"

type CreateSellerCustomerGroupsWorkflowInput = {
  customer_groups: CreateCustomerGroupDTO[]
  seller_id: string
}

export const createSellerCustomerGroupsWorkflow = createWorkflow(
  "create-seller-customer-groups",
  function (input: CreateSellerCustomerGroupsWorkflowInput) {
    const createdCustomerGroups = createCustomerGroupsWorkflow.runAsStep({
      input: {
        customersData: input.customer_groups,
      },
    })

    const customerGroupIds = transform(
      createdCustomerGroups,
      (customerGroups) => customerGroups.map((cg) => cg.id)
    )

    linkSellerCustomerGroupStep({
      seller_id: input.seller_id,
      customer_group_ids: customerGroupIds,
    })

    return new WorkflowResponse(createdCustomerGroups)
  }
)
