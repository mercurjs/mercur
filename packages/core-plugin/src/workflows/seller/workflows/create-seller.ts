import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, emitEventStep } from "@medusajs/medusa/core-flows"
import { CreateSellerDTO, SellerRole } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import { createSellersStep, upsertMembersStep, createSellerMembersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"
import { createMemberInvitesWorkflow } from "./create-member-invites"

export const createSellersWorkflowId = "create-sellers"

type CreateSellersWorkflowInput = {
  sellers: (CreateSellerDTO & { member: { email: string } })[]
} & AdditionalData

export const createSellersWorkflow = createWorkflow(
  createSellersWorkflowId,
  function (input: CreateSellersWorkflowInput) {
    const sellers = createSellersStep(
      transform(input, ({ sellers }) =>
        sellers.map(({ member, ...seller }) => seller)
      )
    )

    const { data: sellerAdminRole } = useQueryGraphStep({
      entity: "role",
      fields: ["id"],
      filters: { handle: "seller-administration" },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-seller-admin-role" })

    const members = upsertMembersStep(
      transform(input, ({ sellers }) =>
        sellers.map(({ member }) => ({ email: member.email }))
      )
    )

    createSellerMembersStep(
      transform(
        { sellers, members, sellerAdminRole },
        ({ sellers, members, sellerAdminRole }) =>
          sellers.map((seller, i) => ({
            seller_id: seller.id,
            member_id: members[i].id,
            role_id: sellerAdminRole[0].id,
            is_owner: true,
          }))
      )
    )

    createMemberInvitesWorkflow.runAsStep({
      input: transform(
        { sellers, input },
        ({ sellers, input }) =>
          sellers.map((seller, i) => ({
            seller_id: seller.id,
            email: input.sellers[i].member.email,
            role_id: SellerRole.SELLER_ADMINISTRATION,
          }))
      )
    })

    const sellersCreated = createHook("sellersCreated", {
      sellers,
      additional_data: input.additional_data,
    })

    const eventData = transform({ sellers }, ({ sellers }) =>
      sellers.map((s) => ({ id: s.id }))
    )

    emitEventStep({
      eventName: SellerWorkflowEvents.CREATED,
      data: eventData,
    })

    return new WorkflowResponse(sellers, { hooks: [sellersCreated] })
  }
)
