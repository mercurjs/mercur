import { Context, DAL, FindConfig, InternalModuleDeclaration } from "@medusajs/framework/types"
import {
  InjectManager,
  isValidHandle,
  MedusaContext,
  MedusaError,
  MedusaService,
  toHandle,
  InjectTransactionManager,
} from "@medusajs/framework/utils"
import crypto from "node:crypto"
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
import { MemberDTO, MemberInviteDTO, OrderGroupDTO, SellerDTO, SellerModuleOptions } from "@mercurjs/types"

const DEFAULT_INVITE_VALID_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 days

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
  protected readonly options_: SellerModuleOptions

  constructor(
    { orderGroupRepository, baseRepository }: InjectedDependencies,
    protected readonly moduleDeclaration?: InternalModuleDeclaration,
  ) {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
    this.orderGroupRepository_ = orderGroupRepository
    this.baseRepository_ = baseRepository
    this.options_ = (moduleDeclaration?.options as SellerModuleOptions) ?? {}
  }

  @InjectTransactionManager()
  // @ts-ignore
  async createSellers<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? SellerDTO[] : SellerDTO> {
    const input = (Array.isArray(data) ? data : [data]).map((seller) => {
      this.validateSellerData_(seller)

      if (!seller.handle && seller.name) {
        seller.handle = toHandle(seller.name)
      }

      return seller
    })

    const result = await super.createSellers(input, sharedContext)
    return (Array.isArray(data) ? result : result[0]) as any
  }

  @InjectTransactionManager()
  // @ts-ignore
  async updateSellers<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? SellerDTO[] : SellerDTO> {
    const input = (Array.isArray(data) ? data : [data]).map((seller) => {
      this.validateSellerData_(seller)

      if (!seller.handle && seller.name) {
        seller.handle = toHandle(seller.name)
      }

      return seller
    })

    // @ts-ignore
    return super.updateSellers(input, sharedContext) as any
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

  @InjectTransactionManager()
  // @ts-ignore
  async createMemberInvites<T extends any | any[]>(
    data: T,
    sharedContext?: Context,
  ): Promise<T extends any[] ? MemberInviteDTO[] : MemberInviteDTO> {
    const validDuration = this.options_.invite_valid_duration ?? DEFAULT_INVITE_VALID_DURATION_SECONDS

    const input = (Array.isArray(data) ? data : [data]).map((invite) => ({
      ...invite,
      token: invite.token ?? crypto.randomUUID(),
      accepted: invite.accepted ?? false,
      expires_at: invite.expires_at ?? new Date(Date.now() + validDuration * 1000),
    }))

    const result = await super.createMemberInvites(input, sharedContext)
    return (Array.isArray(data) ? result : result[0]) as any
  }

  @InjectManager()
  async validateMemberInviteToken(
    token: string,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<MemberInviteDTO> {
    const [invites] = await this.listAndCountMemberInvites(
      { token, accepted: false },
      {},
      sharedContext,
    )

    if (!invites.length) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "Invalid or already used invite token"
      )
    }

    const invite = invites[0] as MemberInviteDTO

    if (new Date() > new Date(invite.expires_at)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Invite token has expired"
      )
    }

    return invite
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
