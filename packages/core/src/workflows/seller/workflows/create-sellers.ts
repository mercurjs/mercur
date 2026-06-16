import {
  createHook,
  createWorkflow,
  transform,
  WorkflowResponse,
  type Hook,
  type ReturnWorkflow,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "@medusajs/medusa/core-flows"
import {
  CreateSellerDTO,
  SellerDTO,
  SellerRole,
  SellerStatus,
} from "@mercurjs/types"
import { AdditionalData } from "@medusajs/framework/types"

import {
  createSellersStep,
  upsertMembersStep,
  createSellerMembersStep,
} from "../steps"
import { SellerWorkflowEvents } from "../../events"

export const createSellersWorkflowId = "create-sellers"

export type CreateSellersWorkflowInput = {
  sellers: (CreateSellerDTO & { member: { email: string } })[]
} & AdditionalData

export type CreateSellersWorkflowHooks = [
  Hook<"validate", { input: CreateSellersWorkflowInput }, unknown>,
  Hook<
    "sellersCreated",
    {
      sellers: SellerDTO[]
      additional_data: Record<string, unknown> | undefined
    },
    unknown
  >,
]

export const createSellersWorkflow: ReturnWorkflow<
  CreateSellersWorkflowInput,
  SellerDTO[],
  CreateSellersWorkflowHooks
> = createWorkflow(
  createSellersWorkflowId,
  function (input: CreateSellersWorkflowInput) {
    const validate = createHook("validate", {
      input,
    })

    const sellers = createSellersStep(
      transform(input, ({ sellers }) =>
        sellers.map(({ member: _member, ...seller }) => ({
          ...seller,
          // Admin-created sellers start as pending approval, same as
          status: seller.status ?? SellerStatus.PENDING_APPROVAL,
        }))
      )
    )

    // Admin-created sellers get their member provisioned directly as the
    // store owner (the admin assigns an existing or new member by email),
    // mirroring the self-service create-seller-account flow.
    const members = upsertMembersStep(
      transform(input, ({ sellers }) =>
        sellers.map(({ member }) => ({ email: member.email }))
      )
    )

    createSellerMembersStep(
      transform({ sellers, members }, ({ sellers, members }) =>
        sellers.map((seller, i) => ({
          seller_id: seller.id,
          member_id: members[i].id,
          role_id: SellerRole.SELLER_ADMINISTRATION,
          is_owner: true,
        }))
      )
    )

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

    return new WorkflowResponse(sellers, { hooks: [validate, sellersCreated] })
  }
)
