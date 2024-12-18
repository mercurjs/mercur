import jwt, { JwtPayload } from 'jsonwebtoken'

import { ConfigModule } from '@medusajs/framework'
import { Context, CreateInviteDTO } from '@medusajs/framework/types'
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService
} from '@medusajs/framework/utils'

import { SELLER_MODULE } from '.'
import { Invite, Member, Seller } from './models'
import { MemberInviteDTO } from './types'

type InjectedDependencies = {
  configModule: ConfigModule
}

type SellerModuleConfig = {
  validInviteDuration: number
}

// 7 days
const DEFAULT_VALID_INVITE_DURATION = 60 * 60 * 24 * 7000

class SellerModuleService extends MedusaService({
  Invite,
  Member,
  Seller
}) {
  private readonly config_: SellerModuleConfig
  private readonly httpConfig_: ConfigModule['projectConfig']['http']

  constructor({ configModule }: InjectedDependencies) {
    super(...arguments)

    this.httpConfig_ = configModule.projectConfig.http

    const moduleDef = configModule.modules?.[SELLER_MODULE]

    const options =
      typeof moduleDef !== 'boolean'
        ? (moduleDef?.options as SellerModuleConfig)
        : null

    this.config_ = {
      validInviteDuration:
        options?.validInviteDuration ?? DEFAULT_VALID_INVITE_DURATION
    }
  }

  async validateInviteToken(token: string) {
    const jwtSecret = this.httpConfig_.jwtSecret
    const decoded: JwtPayload = jwt.verify(token, jwtSecret, {
      complete: true
    })

    const invite = await this.retrieveInvite(decoded.payload.id, {})

    if (invite.accepted) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'The invite has already been accepted'
      )
    }

    if (invite.expires_at < new Date()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'The invite has expired'
      )
    }

    return invite
  }

  @InjectTransactionManager()
  // @ts-expect-error: createInvites method already exists
  async createInvites(
    input: CreateInviteDTO | CreateInviteDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<MemberInviteDTO[]> {
    const data = Array.isArray(input) ? input : [input]

    const toCreate = data.map((invite) => {
      return {
        ...invite,
        expires_at: new Date(),
        token: 'placeholder'
      }
    })

    const created = await super.createInvites(toCreate, sharedContext)

    const toUpdate = Array.isArray(created) ? created : [created]

    const updates = toUpdate.map((invite) => {
      return {
        id: invite.id,
        expires_at: new Date().setMilliseconds(
          new Date().getMilliseconds() + DEFAULT_VALID_INVITE_DURATION
        ),
        token: this.generateToken({ id: invite.id })
      }
    })

    await this.updateInvites(updates, sharedContext)

    return this.listInvites({
      id: updates.map((u) => u.id)
    })
  }

  private generateToken(data: { id: string }): string {
    const jwtSecret = this.httpConfig_.jwtSecret as string
    return jwt.sign(data, jwtSecret, {
      expiresIn: this.config_.validInviteDuration
    })
  }
}

export default SellerModuleService
