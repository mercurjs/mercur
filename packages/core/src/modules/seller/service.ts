import { configManager } from "@medusajs/framework/config"
import { SqlEntityManager } from "@medusajs/framework/mikro-orm/postgresql"
import { Context, DAL, FindConfig, InternalModuleDeclaration } from "@medusajs/framework/types"
import {
  generateJwtToken,
  InjectManager,
  isObject,
  isValidHandle,
  MedusaContext,
  MedusaError,
  MedusaService,
  toHandle,
  InjectTransactionManager,
} from "@medusajs/framework/utils"
import jwt, { JwtPayload } from "jsonwebtoken"
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
import { MemberDTO, MemberInviteDTO, OrderGroupDTO, SellerDTO, SellerModuleOptions } from "@mercurjs/types"

const DEFAULT_INVITE_VALID_DURATION_SECONDS = 60 * 60 * 24 * 7 // 7 days
const OPERATOR_MAP = {
  $eq: "=",
  $lt: "<",
  $gt: ">",
  $lte: "<=",
  $gte: ">=",
  $ne: "!=",
  $in: "IN",
  $nin: "NOT IN",
  $like: "LIKE",
  $ilike: "ILIKE",
}

type InjectedDependencies = {
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
  protected readonly baseRepository_: DAL.RepositoryService
  protected readonly options_: SellerModuleOptions

  constructor(
    { baseRepository }: InjectedDependencies,
    protected readonly moduleDeclaration?: InternalModuleDeclaration,
  ) {
    // @ts-ignore
    // eslint-disable-next-line prefer-rest-params
    super(...arguments)
    this.baseRepository_ = baseRepository

    const opts = (moduleDeclaration?.options as SellerModuleOptions) ?? {}
    const jwtSecret =
      opts.jwt_secret ??
      (configManager.config?.projectConfig?.http?.jwtSecret as string | undefined) ??
      process.env.JWT_SECRET ??
      "supersecret"

    this.options_ = {
      ...opts,
      jwt_secret: jwtSecret,
    }
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

    const inviteList = Array.isArray(data) ? data : [data]

    const sellerIds = [...new Set(inviteList.map((i) => i.seller_id))]
    const sellers = await this.listSellers(
      { id: sellerIds },
      { select: ["id", "name"] },
      sharedContext,
    )
    const sellerMap = new Map(sellers.map((s) => [s.id, s.name]))

    const emails = inviteList.map((i) => i.email)
    const existingMembers = await this.listMembers(
      { email: emails },
      { select: ["id", "email"] },
      sharedContext,
    )
    const existingEmailSet = new Set(existingMembers.map((m) => m.email))

    // Check if any invited emails already belong to the seller
    if (existingMembers.length > 0) {
      const memberIds = existingMembers.map((m) => m.id)
      const existingSellerMembers = await this.listSellerMembers(
        { seller_id: sellerIds, member_id: memberIds },
        { select: ["seller_id", "member_id"] },
        sharedContext,
      )

      if (existingSellerMembers.length > 0) {
        const memberIdToEmail = new Map(existingMembers.map((m) => [m.id, m.email]))
        const alreadyInSeller = new Set(
          existingSellerMembers.map((sm) => `${sm.seller_id}:${memberIdToEmail.get(sm.member_id)}`)
        )

        const duplicates = inviteList.filter((i) =>
          alreadyInSeller.has(`${i.seller_id}:${i.email}`)
        )

        if (duplicates.length > 0) {
          const emails = duplicates.map((d) => d.email).join(", ")
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `The following emails are already members of the seller: ${emails}`
          )
        }
      }
    }

    const input = inviteList.map((invite) => {
      const id = invite.id ?? `meminv_${crypto.randomUUID()}`
      return {
        ...invite,
        id,
        token: this.generateInviteToken_(
          {
            id,
            email: invite.email,
            seller_name: sellerMap.get(invite.seller_id) ?? "",
            existing_member: existingEmailSet.has(invite.email),
          },
          validDuration,
        ),
        accepted: invite.accepted ?? false,
        expires_at: invite.expires_at ?? new Date(Date.now() + validDuration * 1000),
      }
    })

    const result = await super.createMemberInvites(input, sharedContext)
    return (Array.isArray(data) ? result : result[0]) as any
  }

  @InjectManager()
  async validateMemberInviteToken(
    token: string,
    @MedusaContext() sharedContext: Context = {},
  ): Promise<MemberInviteDTO> {
    let decoded: JwtPayload
    try {
      decoded = jwt.verify(token, this.options_.jwt_secret, {
        complete: true,
      }) as JwtPayload
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid invite token"
      )
    }

    const invite = await this.retrieveMemberInvite(
      decoded.payload.id,
      {},
      sharedContext,
    ) as MemberInviteDTO

    if (invite.accepted) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Invite has already been accepted"
      )
    }

    if (new Date() > new Date(invite.expires_at)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Invite token has expired"
      )
    }

    return invite
  }

  private generateInviteToken_(
    data: { id: string; email: string; seller_name: string; existing_member: boolean },
    expiresIn: number,
  ): string {
    return generateJwtToken(data, {
      secret: this.options_.jwt_secret,
      expiresIn,
      jwtOptions: {
        jwtid: crypto.randomUUID(),
      },
    })
  }

  private validateSellerData_(data: any) {
    if (data.handle && !isValidHandle(data.handle)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid seller handle '${data.handle}'. It must contain URL safe characters`
      )
    }
  }

  private parseOrderGroupFilterValue_(
    column: string,
    value: unknown,
    whereClauses: string[],
    params: unknown[]
  ) {
    if (!isObject(value)) {
      if (Array.isArray(value)) {
        const placeholders = value.map(() => "?").join(",")
        whereClauses.push(`${column} IN (${placeholders})`)
        params.push(...value)
      } else {
        whereClauses.push(`${column} = ?`)
        params.push(value)
      }
      return
    }

    for (const [operator, operand] of Object.entries(value)) {
      const sqlOperator = OPERATOR_MAP[operator]
      if (!sqlOperator) {
        continue
      }

      if (sqlOperator === "IN" || sqlOperator === "NOT IN") {
        const values = Array.isArray(operand) ? operand : [operand]
        const placeholders = values.map(() => "?").join(",")
        whereClauses.push(`${column} ${sqlOperator} (${placeholders})`)
        params.push(...values)
      } else {
        whereClauses.push(`${column} ${sqlOperator} ?`)
        params.push(operand)
      }
    }
  }

  private async findAndCountOrderGroups_(
    filters: Record<string, any> = {},
    config: FindConfig<any> = {},
    sharedContext: Context = {}
  ): Promise<[Record<string, any>[], number]> {
    const manager = (sharedContext.transactionManager ??
      sharedContext.manager) as SqlEntityManager | undefined

    if (!manager) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Order group queries require an active manager"
      )
    }

    const knex = manager.getKnex()
    const orderBy = config.order || {}

    const params: unknown[] = []
    const whereClauses: string[] = ["og.deleted_at IS NULL"]

    if (filters.id) {
      const ids = Array.isArray(filters.id) ? filters.id : [filters.id]
      const placeholders = ids.map(() => "?").join(",")
      whereClauses.push(`og.id IN (${placeholders})`)
      params.push(...ids)
    }

    if (filters.customer_id) {
      const customerIds = Array.isArray(filters.customer_id)
        ? filters.customer_id
        : [filters.customer_id]
      const placeholders = customerIds.map(() => "?").join(",")
      whereClauses.push(`og.customer_id IN (${placeholders})`)
      params.push(...customerIds)
    }

    if (filters.seller_id) {
      const sellerIds = Array.isArray(filters.seller_id)
        ? filters.seller_id
        : [filters.seller_id]
      const placeholders = sellerIds.map(() => "?").join(",")
      whereClauses.push(`oso.seller_id IN (${placeholders})`)
      params.push(...sellerIds)
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status]
      const placeholders = statuses.map(() => "?").join(",")
      whereClauses.push(`o.status IN (${placeholders})`)
      params.push(...statuses)
    }

    if (filters.sales_channel_id) {
      const salesChannelIds = Array.isArray(filters.sales_channel_id)
        ? filters.sales_channel_id
        : [filters.sales_channel_id]
      const placeholders = salesChannelIds.map(() => "?").join(",")
      whereClauses.push(`o.sales_channel_id IN (${placeholders})`)
      params.push(...salesChannelIds)
    }

    if (filters.created_at) {
      this.parseOrderGroupFilterValue_(
        "og.created_at",
        filters.created_at,
        whereClauses,
        params
      )
    }

    if (filters.updated_at) {
      this.parseOrderGroupFilterValue_(
        "og.updated_at",
        filters.updated_at,
        whereClauses,
        params
      )
    }

    if (filters.q) {
      whereClauses.push("(og.id ILIKE ? OR og.customer_id ILIKE ?)")
      const searchPattern = `%${filters.q}%`
      params.push(searchPattern, searchPattern)
    }

    const orderByClauses: string[] = []
    if (orderBy.created_at) {
      orderByClauses.push(`og.created_at ${orderBy.created_at}`)
    }
    if (orderBy.updated_at) {
      orderByClauses.push(`og.updated_at ${orderBy.updated_at}`)
    }
    if (orderByClauses.length === 0) {
      orderByClauses.push("og.created_at DESC")
    }

    const whereClause = whereClauses.join(" AND ")

    const countQuery = `
      SELECT COUNT(DISTINCT og.id) as count
      FROM order_group og
      LEFT JOIN order_group_order ogo ON ogo.order_group_id = og.id
      LEFT JOIN "order" o ON o.id = ogo.order_id
      LEFT JOIN order_order_seller_seller oso ON oso.order_id = o.id
      WHERE ${whereClause}
    `

    let query = `
      SELECT
        og.*,
        COUNT(DISTINCT oso.seller_id) as seller_count,
        COALESCE(SUM((os.totals->>'current_order_total')::numeric), 0) as total
      FROM order_group og
      LEFT JOIN order_group_order ogo ON ogo.order_group_id = og.id
      LEFT JOIN "order" o ON o.id = ogo.order_id
      LEFT JOIN order_summary os ON os.order_id = o.id AND os.version = o.version
      LEFT JOIN order_order_seller_seller oso ON oso.order_id = o.id
      WHERE ${whereClause}
      GROUP BY og.id
      ORDER BY ${orderByClauses.join(", ")}
    `

    const paginationParams: unknown[] = []

    if (config.take) {
      query += " LIMIT ?"
      paginationParams.push(config.take)
    }

    if (config.skip) {
      query += " OFFSET ?"
      paginationParams.push(config.skip)
    }

    const [result, countResult] = await Promise.all([
      knex.raw(query, [...params, ...paginationParams]),
      knex.raw(countQuery, params),
    ])

    const rows = result.rows.map((row) => ({
      ...row,
      total: row.total ? Number(row.total) : 0,
      seller_count: row.seller_count ? Number(row.seller_count) : 0,
    })) ?? []
    const count = parseInt(countResult.rows?.[0]?.count || "0", 10)

    return [rows, count]
  }

  @InjectManager()
  // @ts-ignore
  async listOrderGroups(
    filters: any = {},
    config: FindConfig<any> = {},
    @MedusaContext() sharedContext: Context = {}
  ) {
    const [orderGroups] = await this.findAndCountOrderGroups_(
      filters,
      config,
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
    const [orderGroups, count] = await this.findAndCountOrderGroups_(
      filters,
      config,
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
    const [orderGroups] = await this.findAndCountOrderGroups_(
      { id },
      config,
      sharedContext
    )

    return await this.baseRepository_.serialize<OrderGroupDTO>(orderGroups[0])
  }
}

export default SellerModuleService
