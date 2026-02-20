import jwt, { JwtPayload } from "jsonwebtoken"

import { ConfigModule } from "@medusajs/framework"
import { Context } from "@medusajs/framework/types"
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils"

import { Member } from "./models/member"
import { MemberInvite } from "./models/member-invite"
import { CreateMemberInviteDTO, MemberInviteDTO } from "./types"

const MEMBER_MODULE = "member"

type InjectedDependencies = {
  configModule: ConfigModule
}

// 7 days in ms
const DEFAULT_VALID_INVITE_DURATION = 1000 * 60 * 60 * 24 * 7

class MemberModuleService extends MedusaService({
  Member,
  MemberInvite,
}) {
  private readonly httpConfig_: ConfigModule["projectConfig"]["http"]
  private readonly validInviteDuration_: number

  constructor({ configModule }: InjectedDependencies) {
    super(...arguments)

    this.httpConfig_ = configModule.projectConfig.http

    const moduleDef = configModule.modules?.[MEMBER_MODULE]
    const options =
      typeof moduleDef !== "boolean"
        ? (moduleDef?.options as { validInviteDuration?: number })
        : null

    this.validInviteDuration_ =
      options?.validInviteDuration ?? DEFAULT_VALID_INVITE_DURATION
  }

  async validateInviteToken(token: string) {
    const jwtSecret = this.httpConfig_.jwtSecret
    const decoded: JwtPayload = jwt.verify(token, jwtSecret, {
      complete: true,
    })

    const invite = await this.retrieveMemberInvite(decoded.payload.id, {})

    if (invite.accepted) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The invite has already been accepted"
      )
    }

    if (invite.expires_at < new Date()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The invite has expired"
      )
    }

    return invite
  }

  @InjectTransactionManager()
  // @ts-expect-error: createMemberInvites method already exists in base
  async createMemberInvites(
    input: CreateMemberInviteDTO | CreateMemberInviteDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<MemberInviteDTO[]> {
    const data = Array.isArray(input) ? input : [input]

    const expires_at = new Date()
    expires_at.setMilliseconds(
      new Date().getMilliseconds() + DEFAULT_VALID_INVITE_DURATION
    )

    const toCreate = data.map((invite) => {
      return {
        ...invite,
        expires_at: new Date(),
        token: "placeholder",
      }
    })

    const created = await super.createMemberInvites(toCreate, sharedContext)
    const toUpdate = Array.isArray(created) ? created : [created]

    const updates = toUpdate.map((invite) => {
      return {
        ...invite,
        id: invite.id,
        expires_at,
        token: this.generateToken({ id: invite.id }),
      }
    })

    await this.updateMemberInvites(updates, sharedContext)

    return updates
  }

  private generateToken(data: { id: string }): string {
    const jwtSecret = this.httpConfig_.jwtSecret as string
    return jwt.sign(data, jwtSecret, {
      expiresIn: this.validInviteDuration_ / 1000,
    })
  }
}

export default MemberModuleService
