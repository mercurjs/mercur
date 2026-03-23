import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  setAuthAppMetadataStep,
  useQueryGraphStep,
} from "@medusajs/medusa/core-flows"
import { CreateSellerDTO, SellerStatus } from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import {
  createSellersStep,
  upsertMembersStep,
  createSellerMembersStep,
} from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const createSellerAccountWorkflowId = "create-seller-account"

type CreateSellerAccountWorkflowInput = {
  auth_identity_id: string
  seller: CreateSellerDTO
  member: { email: string }
} & AdditionalData

export const createSellerAccountWorkflow = createWorkflow(
  createSellerAccountWorkflowId,
  function (input: CreateSellerAccountWorkflowInput) {
    const sellerData = transform(input, ({ seller }) => [
      { ...seller, status: SellerStatus.PENDING_APPROVAL },
    ])

    const sellers = createSellersStep(sellerData)
    const seller = transform({ sellers }, ({ sellers }) => sellers[0])

    const { data: sellerAdminRole } = useQueryGraphStep({
      entity: "role",
      fields: ["id"],
      filters: { handle: "seller-administration" },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-seller-admin-role" })

    const members = upsertMembersStep(
      transform(input, ({ member }) => [{ email: member.email }])
    )

    const member = transform({ members }, ({ members }) => members[0])

    createSellerMembersStep(
      transform(
        { seller, member, sellerAdminRole },
        ({ seller, member, sellerAdminRole }) => [
          {
            seller_id: seller.id,
            member_id: member.id,
            role_id: sellerAdminRole[0].id,
            is_owner: true,
          },
        ]
      )
    )

    setAuthAppMetadataStep({
      authIdentityId: input.auth_identity_id,
      actorType: "member",
      value: member.id,
    })

    const sellerAccountCreated = createHook("sellerAccountCreated", {
      seller,
      additional_data: input.additional_data,
    })

    emitEventStep({
      eventName: SellerWorkflowEvents.CREATED,
      data: [{ id: seller.id }],
    })

    return new WorkflowResponse(seller, { hooks: [sellerAccountCreated] })
  }
)
