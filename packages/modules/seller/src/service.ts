import jwt, { JwtPayload } from "jsonwebtoken";

import { ConfigModule } from "@medusajs/framework";
import { Context, CreateInviteDTO } from "@medusajs/framework/types";
import {
  InjectTransactionManager,
  MedusaContext,
  MedusaError,
  MedusaService,
} from "@medusajs/framework/utils";

import { SELLER_MODULE } from ".";
import { Member, MemberInvite, Seller, SellerOnboarding } from "./models";
import { MemberInviteDTO } from "@mercurjs/framework";

/**
 * @interface InjectedDependencies
 * @description Represents the injected dependencies for the seller module service.
 * 
 * @property {ConfigModule} configModule - The configmodule of the injected dependencies

 */
type InjectedDependencies = {
  configModule: ConfigModule;
};

/**
 * @interface SellerModuleConfig
 * @description Represents the seller module config.
 * 
 * @property {number} validInviteDuration - The valid invite duration of the seller module config

 */
type SellerModuleConfig = {
  validInviteDuration: number;
};

// 7 days in ms
const DEFAULT_VALID_INVITE_DURATION = 1000 * 60 * 60 * 24 * 7;

/**
 * @class SellerModuleService
 * @description Represents the seller module service.
 */
class SellerModuleService extends MedusaService({
  MemberInvite,
  Member,
  Seller,
  SellerOnboarding,
}) {
  private readonly config_: SellerModuleConfig;
  private readonly httpConfig_: ConfigModule["projectConfig"]["http"];

  constructor({ configModule }: InjectedDependencies) {
    super(...arguments);

    this.httpConfig_ = configModule.projectConfig.http;

    const moduleDef = configModule.modules?.[SELLER_MODULE];

    const options =
      typeof moduleDef !== "boolean"
        ? (moduleDef?.options as SellerModuleConfig)
        : null;

    this.config_ = {
      validInviteDuration:
        options?.validInviteDuration ?? DEFAULT_VALID_INVITE_DURATION,
    };
  }

  /**
 * @method validateInviteToken
 * @description This method validates the integrity and expiration of an invite token
 * 
 * @param {string} token - Unique identifier for a membership invitation
 * @returns {Promise<any>} Represents the completion of an asynchronous operation

 */
  async validateInviteToken(token: string) {
    const jwtSecret = this.httpConfig_.jwtSecret;
    const decoded: JwtPayload = jwt.verify(token, jwtSecret, {
      complete: true,
    });

    const invite = await this.retrieveMemberInvite(decoded.payload.id, {});

    if (invite.accepted) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The invite has already been accepted"
      );
    }

    if (invite.expires_at < new Date()) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The invite has expired"
      );
    }

    return invite;
  }

  /**
 * @method createMemberInvites
 * @description This method creates member invites.
 * 
 * @param {any} input - Details for generating new member invitations
 * @param {Context} sharedContext - Medusa framework's execution context
 * @returns {Promise<MemberInviteDTO[]>} The created member invites.

 */
  @InjectTransactionManager()
  // @ts-expect-error: createInvites method already exists
  async createMemberInvites(
    input: CreateInviteDTO | CreateInviteDTO[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<MemberInviteDTO[]> {
    const data = Array.isArray(input) ? input : [input];

    const expires_at = new Date();
    expires_at.setMilliseconds(
      new Date().getMilliseconds() + DEFAULT_VALID_INVITE_DURATION
    );
    const toCreate = data.map((invite) => {
      return {
        ...invite,
        expires_at: new Date(),
        token: "placeholder",
      };
    });

    const created = await super.createMemberInvites(toCreate, sharedContext);
    const toUpdate = Array.isArray(created) ? created : [created];

    const updates = toUpdate.map((invite) => {
      return {
        ...invite,
        id: invite.id,
        expires_at,
        token: this.generateToken({ id: invite.id }),
      };
    });

    // @ts-ignore
    await this.updateMemberInvites(updates, sharedContext);

    return updates;
  }

  /**
 * @method generateToken
 * @description This method creates a secure token for a given ID
 * 
 * @param {{ id: string; }} data - Credentials for secure authentication token generation
 * @returns {string} Generates a secure token for user authentication.

 */
  private generateToken(data: { id: string }): string {
    const jwtSecret = this.httpConfig_.jwtSecret as string;
    return jwt.sign(data, jwtSecret, {
      expiresIn: this.config_.validInviteDuration / 1000,
    });
  }

  /**
 * @method isOnboardingCompleted
 * @description This method represents the completion of an asynchronous operation
 * 
 * @param {string} seller_id - Unique identifier for the seller in query.
 * @returns {Promise<boolean>} Represents the completion of an asynchronous operation

 */
  async isOnboardingCompleted(seller_id: string): Promise<boolean> {
    const { onboarding } = await this.retrieveSeller(seller_id, {
      relations: ["onboarding"],
    });

    if (!onboarding) {
      return false;
    }

    return (
      onboarding.locations_shipping &&
      onboarding.products &&
      onboarding.store_information &&
      onboarding.stripe_connection
    );
  }
}

export default SellerModuleService;
