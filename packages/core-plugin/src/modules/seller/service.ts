import { Context, DAL, FindConfig } from "@medusajs/framework/types"
import {
  InjectManager,
  isValidHandle,
  MedusaContext,
  MedusaError,
  MedusaService,
  toHandle,
  InjectTransactionManager,
  isDefined
} from "@medusajs/framework/utils"
import { OrderGroup, Seller } from "./models"
import { OrderGroupRepository } from "./repositories"
import { OrderGroupDTO, SellerModuleOptions, SellerStatus } from "@mercurjs/types"

type InjectedDependencies = {
  orderGroupRepository: OrderGroupRepository
  baseRepository: DAL.RepositoryService
}

class SellerModuleService extends MedusaService({
  OrderGroup,
  Seller,
}) {
  protected readonly orderGroupRepository_: OrderGroupRepository
  protected readonly baseRepository_: DAL.RepositoryService
  protected readonly options_: Required<SellerModuleOptions>

  constructor({ orderGroupRepository, baseRepository }: InjectedDependencies, options?: SellerModuleOptions) {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
    this.orderGroupRepository_ = orderGroupRepository
    this.baseRepository_ = baseRepository
    this.options_ = {
      autoApprove: false,
      ...(options ?? {}),
    }
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createSellers(data: any | any[], sharedContext?: Context) {
    const sellersData = Array.isArray(data) ? data : [data]

    for (const sellerData of sellersData) {
      if (!data.name) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Seller name is required`
        )
      }

      this.validateSellerData_(sellerData)

      if (!sellerData.handle && sellerData.name) {
        sellerData.handle = toHandle(sellerData.name)
      }

      if (this.options_.autoApprove && !isDefined(sellerData.status)) {
        sellerData.status = SellerStatus.ACTIVE
      }
    }

    // @ts-ignore
    return super.createSellers(data, sharedContext)
  }

  @InjectTransactionManager()
  // @ts-ignore
  async updateSellers(data: any | any[], sharedContext?: Context) {
    const sellersData = Array.isArray(data) ? data : [data]

    for (const sellerData of sellersData) {
      this.validateSellerData_(sellerData)
    }

    // @ts-ignore
    return super.updateSellers(data, sharedContext)
  }

  private validateSellerData_(data: any) {
    if (data.handle && !isValidHandle(data.handle)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid seller handle '${data.handle}'. It must contain URL safe characters`
      )
    }
  }

  @InjectManager()
  // @ts-ignore
  async listOrderGroups(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const [orderGroups] = await this.orderGroupRepository_.findAndCount(
      {
        where: filters,
        options: config,
      },
      sharedContext
    )

    return await this.baseRepository_.serialize<OrderGroupDTO[]>(orderGroups)
  }

  @InjectManager()
  // @ts-ignore
  async listAndCountOrderGroups(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const [orderGroups, count] = await this.orderGroupRepository_.findAndCount(
      {
        where: filters,
        options: config,
      },
      sharedContext
    )
    return [
      await this.baseRepository_.serialize<OrderGroupDTO[]>(orderGroups),
      count,
    ]
  }

  @InjectManager()
  // @ts-ignore
  async retrieveOrderGroup(
    id: string,
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const [orderGroups] = await this.orderGroupRepository_.findAndCount(
      {
        where: { id },
        options: config,
      },
      sharedContext
    )

    return await this.baseRepository_.serialize<OrderGroupDTO>(orderGroups[0])
  }
}

export default SellerModuleService
