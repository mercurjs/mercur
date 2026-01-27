import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOrderGroupDTO, OrderGroupDTO } from "@mercurjs/types"

import { SELLER_MODULE } from "../../../modules/seller"
import SellerModuleService from "../../../modules/seller/service"

type CreateOrderGroupStepInput = CreateOrderGroupDTO

export const createOrderGroupStep = createStep(
  "create-order-group",
  async (input: CreateOrderGroupStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    const orderGroup: OrderGroupDTO = await service.createOrderGroups(input)

    return new StepResponse(orderGroup, orderGroup.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(SELLER_MODULE)

    await service.deleteOrderGroups([id])
  }
)
