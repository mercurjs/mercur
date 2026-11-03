import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOrderGroupDTO, MercurModules, OrderGroupDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type CreateOrderGroupStepInput = CreateOrderGroupDTO

type CreateOrderGroupStepOutput = Pick<
  OrderGroupDTO,
  "id" | "display_id" | "cart_id" | "customer_id"
>

export const createOrderGroupStep = createStep(
  "create-order-group",
  async (input: CreateOrderGroupStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    // A completion interrupted before its orders were created leaves the group
    // behind; reuse it so a retry doesn't create a second one for the cart.
    const [existing] = await service.listOrderGroups({ cart_id: input.cart_id })

    if (existing) {
      return new StepResponse<CreateOrderGroupStepOutput, string | null>(
        existing,
        null
      )
    }

    const orderGroup = await service.createOrderGroups(input)

    return new StepResponse<CreateOrderGroupStepOutput, string | null>(
      orderGroup,
      orderGroup.id
    )
  },
  async (id: string | null, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    await service.deleteOrderGroups([id])
  }
)
