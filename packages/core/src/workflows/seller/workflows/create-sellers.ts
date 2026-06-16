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

import { createSellersStep } from "../steps"
import { SellerWorkflowEvents } from "../../events"
import { createMemberInvitesWorkflow } from "./create-member-invites"

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

    return new WorkflowResponse(sellers, { hooks: [validate, sellersCreated] })
  }
)
