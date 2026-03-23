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
import {
  Seller,
  ProfessionalDetails,
  SellerAddress,
  PaymentDetails,
  Member,
  SellerMember,
  MemberInvite,
  OrderGroup,
} from "./models"
import { OrderGroupRepository } from "./repositories"
import { MemberDTO, OrderGroupDTO, SellerModuleOptions, SellerStatus } from "@mercurjs/types"

type InjectedDependencies = {
  orderGroupRepository: OrderGroupRepository
  baseRepository: DAL.RepositoryService
}

class SellerModuleService extends MedusaService({
  Seller,
  ProfessionalDetails,
  SellerAddress,
  PaymentDetails,
  Member,
  SellerMember,
  MemberInvite,
  OrderGroup,
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
  async createSellers(
    data: any | any[],
    sharedContext?: Context,
  ) {
    const input = (Array.isArray(data) ? data : [data]).map((seller) => {
      this.validateSellerData_(seller)

      if (!seller.handle && seller.name) {
        seller.handle = toHandle(seller.name)
      }

      if (this.options_.autoApprove && !isDefined(seller.status)) {
        seller.status = SellerStatus.ACTIVE
      }

      return seller
    })

    const result = await super.createSellers(input, sharedContext)
    return Array.isArray(data) ? result : result[0]
  }

  @InjectTransactionManager()
  // @ts-ignore
  async updateSellers(
    data: any | any[],
    sharedContext?: Context,
  ) {
    const input = (Array.isArray(data) ? data : [data]).map((seller) => {
      if (isDefined(seller.currency_code)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Currency code is immutable after creation and cannot be updated",
        )
      }

      this.validateSellerData_(seller)

      if (!seller.handle && seller.name) {
        seller.handle = toHandle(seller.name)
      }

      return seller
    })

    // @ts-ignore
    return super.updateSellers(input, sharedContext)
  }

  @InjectTransactionManager()
  async upsertMembers(
    data: { email: string }[],
    sharedContext?: Context,
  ): Promise<MemberDTO[]> {
    const emails = data.map((d) => d.email)
    const existing = await this.listMembers(
      { email: emails },
      {},
      sharedContext,
    )

    const existingMap = new Map(existing.map((m) => [m.email, m]))

    const toCreate = data.filter((d) => !existingMap.has(d.email))

    const created = toCreate.length
      ? await this.createMembers(toCreate, sharedContext)
      : []

    const createdMap = new Map(
      (Array.isArray(created) ? created : [created]).map((m) => [m.email, m])
    )

    return data.map(
      (d) => existingMap.get(d.email) ?? createdMap.get(d.email)!
    )
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
