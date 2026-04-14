import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"
import { CreateOrderGroupDTO, MercurModules, OrderGroupDTO } from "@mercurjs/types"

import SellerModuleService from "../../../modules/seller/service"

type CreateOrderGroupStepInput = CreateOrderGroupDTO

export const createOrderGroupStep = createStep(
  "create-order-group",
  async (input: CreateOrderGroupStepInput, { container }) => {
    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    const orderGroup = await service.createOrderGroups(input)

    return new StepResponse(orderGroup, orderGroup.id)
  },
  async (id: string, { container }) => {
    if (!id) {
      return
    }

    const service = container.resolve<SellerModuleService>(MercurModules.SELLER)

    await service.deleteOrderGroups([id])
  }
)
