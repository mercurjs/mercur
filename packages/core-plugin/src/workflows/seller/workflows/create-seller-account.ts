import {
  createHook,
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  emitEventStep,
  setAuthAppMetadataStep,
} from "@medusajs/medusa/core-flows"
import {
  CreateSellerDTO,
  SellerRole,
  SellerStatus,
  UpdateSellerAddressDTO,
  UpdateProfessionalDetailsDTO,
} from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import {
  createSellersStep,
  upsertMembersStep,
  createSellerMembersStep,
} from "../steps"
import { SellerWorkflowEvents } from "../../events"
import { updateSellerAddressWorkflow } from "./update-seller-address"
import { updateSellerProfessionalDetailsWorkflow } from "./update-seller-professional-details"

export const createSellerAccountWorkflowId = "create-seller-account"

type CreateSellerAccountWorkflowInput = {
  auth_identity_id: string
  seller: CreateSellerDTO
  member_email: string
  address?: UpdateSellerAddressDTO
  professional_details?: UpdateProfessionalDetailsDTO
} & AdditionalData

export const createSellerAccountWorkflow = createWorkflow(
  createSellerAccountWorkflowId,
  function (input: CreateSellerAccountWorkflowInput) {
    const sellerData = transform(input, ({ seller }) => [
      { ...seller, status: SellerStatus.PENDING_APPROVAL },
    ])

    const sellers = createSellersStep(sellerData)
    const seller = transform({ sellers }, ({ sellers }) => sellers[0])

    const members = upsertMembersStep(
      transform(input, ({ member_email }) => [{ email: member_email }])
    )

    const member = transform({ members }, ({ members }) => members[0])

    createSellerMembersStep(
      transform(
        { seller, member },
        ({ seller, member }) => [
          {
            seller_id: seller.id,
            member_id: member.id,
            role_id: SellerRole.SELLER_ADMINISTRATION,
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

    when(input, ({ address }) => !!address).then(() => {
      updateSellerAddressWorkflow.runAsStep({
        input: transform({ seller, input }, ({ seller, input }) => ({
          seller_id: seller.id,
          data: input.address!,
        })),
      })
    })

    when(input, ({ professional_details }) => !!professional_details).then(
      () => {
        updateSellerProfessionalDetailsWorkflow.runAsStep({
          input: transform({ seller, input }, ({ seller, input }) => ({
            seller_id: seller.id,
            data: input.professional_details!,
          })),
        })
      }
    )

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
