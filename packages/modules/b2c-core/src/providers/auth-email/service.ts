import {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityDTO,
  AuthIdentityProviderService,
  EmailPassAuthProviderOptions,
  Logger,
} from "@medusajs/framework/types"
import { AbstractAuthModuleProvider, isString, MedusaError, } from "@medusajs/framework/utils"
import { isPresent } from "@medusajs/utils"
import Scrypt from "scrypt-kdf"

type InjectedDependencies = {
  logger: Logger
}

type AuthIdentityParams = {
  email: string;
  password: string;
  authIdentityService: AuthIdentityProviderService
}

interface PasswordRequirements {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}

interface NameValidation {
  minLength?: number;
  maxLength?: number;
}

interface EmailNormalization {
  lowercase?: boolean;
  stripPlusSuffix?: boolean;
}

interface ExtendedAuthProviderOptions extends EmailPassAuthProviderOptions {
  password?: PasswordRequirements;
  email?: EmailNormalization;
  name?: NameValidation;
  surname?: NameValidation;
}

interface LocalServiceConfig extends ExtendedAuthProviderOptions {}

export interface RegistrationBody {
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface AuthenticationBody {
  email: string;
  password: string;
}

export interface UpdateBody {
  password: string;
  entity_id: string;
}

export class EmailPasswordAuthService extends AbstractAuthModuleProvider {
  static identifier = "emailpassword"
  static DISPLAY_NAME = "Email/Password Authentication"

  protected config_: LocalServiceConfig
  protected logger_: Logger

  constructor(
    { logger }: InjectedDependencies,
    options: ExtendedAuthProviderOptions = {}
  ) {
    // @ts-ignore
    super(...arguments)
    this.config_ = options
    this.logger_ = logger
  }

  protected async hashPassword(password: string) {
    const hashConfig = this.config_.hashConfig ?? { logN: 15, r: 8, p: 1 }
    const passwordHash = await Scrypt.kdf(password, hashConfig)
    return passwordHash.toString("base64")
  }

  /**
   * Normalizes email address based on configuration
   * - Converts to lowercase if enabled
   * - Strips +suffix if enabled (email+inbox@example.com -> email@example.com)
   */
  protected normalizeEmail(email: string): string {
    let normalized = email

    const emailConfig = this.config_.email ?? {}
    
    if (emailConfig.lowercase !== false) {
      normalized = normalized.toLowerCase()
    }

    if (emailConfig.stripPlusSuffix === true) {
      const atIndex = normalized.indexOf('@')
      if (atIndex > 0) {
        const localPart = normalized.substring(0, atIndex)
        const domainPart = normalized.substring(atIndex)
        const plusIndex = localPart.indexOf('+')
        if (plusIndex > 0) {
          normalized = localPart.substring(0, plusIndex) + domainPart
        }
      }
    }

    return normalized
  }

  /**
   * Validates email format
   */
  protected validateEmailFormat(email: string): { valid: boolean; error?: string } {
    if (!email || !isString(email)) {
      return { valid: false, error: "Email is required and must be a string" }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Invalid email format" }
    }

    return { valid: true }
  }

  /**
   * Validates password against configured requirements
   */
  protected validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || !isString(password)) {
      return { valid: false, error: "Password is required and must be a string" }
    }

    const passwordConfig = this.config_.password ?? {}
    const minLength = passwordConfig.minLength ?? 8

    if (password.length < minLength) {
      return {
        valid: false,
        error: `Password must be at least ${minLength} characters long`,
      }
    }

    if (passwordConfig.requireUppercase === true && !/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one uppercase letter",
      }
    }

    if (passwordConfig.requireLowercase === true && !/[a-z]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one lowercase letter",
      }
    }

    if (passwordConfig.requireNumbers === true && !/[0-9]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one number",
      }
    }

    if (passwordConfig.requireSpecialChars === true && !/[^a-zA-Z0-9]/.test(password)) {
      return {
        valid: false,
        error: "Password must contain at least one special character",
      }
    }

    return { valid: true }
  }

  /**
   * Validates name field (first name, surname, etc.)
   * Allows only letters, numbers, commas, dots, and hyphens
   */
  protected validateName(name: string | undefined, fieldName: string, config?: NameValidation): { valid: boolean; error?: string } {
    if (!name) {
      return { valid: true }
    }

    if (!isString(name)) {
      return { valid: false, error: `${fieldName} must be a string` }
    }

    const trimmedName = name.trim()
    const minLength = config?.minLength ?? 1
    const maxLength = config?.maxLength

    if (trimmedName.length < minLength) {
      return {
        valid: false,
        error: `${fieldName} must be at least ${minLength} character(s) long`,
      }
    }

    if (maxLength !== undefined && trimmedName.length > maxLength) {
      return {
        valid: false,
        error: `${fieldName} must be at most ${maxLength} character(s) long`,
      }
    }

    const allowedPattern = /^[a-zA-Z0-9,.\-']+$/
    if (!allowedPattern.test(trimmedName)) {
      return {
        valid: false,
        error: `${fieldName} can only contain letters, numbers, commas, dots, hyphens, and apostrophes`,
      }
    }

    return { valid: true }
  }

  /**
   * Validates all input fields for registration
   */
  protected validateRegistrationInput(body: RegistrationBody | undefined): { valid: boolean; error?: string; normalizedEmail?: string } {
    const { email, password, first_name, last_name } = body ?? {}

    if (!email || typeof email !== 'string') {
      return { valid: false, error: "Email is required and must be a string" }
    }

    const emailValidation = this.validateEmailFormat(email)
    if (!emailValidation.valid) {
      return { valid: false, error: emailValidation.error }
    }

    const normalizedEmail = this.normalizeEmail(email)

    if (!password || typeof password !== 'string') {
      return { valid: false, error: "Password is required and must be a string" }
    }

    const passwordValidation = this.validatePassword(password)
    if (!passwordValidation.valid) {
      return { valid: false, error: passwordValidation.error }
    }

    if (first_name !== undefined) {
      const nameValidation = this.validateName(
        first_name,
        "First name",
        this.config_.name
      )
      if (!nameValidation.valid) {
        return { valid: false, error: nameValidation.error }
      }
    }

    if (last_name !== undefined) {
      const surnameValidation = this.validateName(
        last_name,
        "Last name",
        this.config_.surname
      )
      if (!surnameValidation.valid) {
        return { valid: false, error: surnameValidation.error }
      }
    }

    return { valid: true, normalizedEmail }
  }

  /**
   * Validates input for authentication
   */
  protected validateAuthenticationInput(body: AuthenticationBody | undefined): { valid: boolean; error?: string; normalizedEmail?: string } {
    const { email, password } = body ?? {}

    if (!email || typeof email !== 'string') {
      return { valid: false, error: "Email is required and must be a string" }
    }

    const emailValidation = this.validateEmailFormat(email)
    if (!emailValidation.valid) {
      return { valid: false, error: emailValidation.error }
    }

    const normalizedEmail = this.normalizeEmail(email)

    if (!password || typeof password !== 'string') {
      return { valid: false, error: "Password is required and must be a string" }
    }

    return { valid: true, normalizedEmail }
  }

  async update(
    data: Record<string, unknown>,
    authIdentityService: AuthIdentityProviderService
  ) {
    const updateData = data as unknown as UpdateBody
    const { password, entity_id } = updateData ?? {}

    if (!entity_id) {
      return {
        success: false,
        error: `Cannot update ${this.provider} provider identity without entity_id`,
      }
    }

    if (!password || !isString(password)) {
      return { success: true }
    }

    const passwordValidation = this.validatePassword(password)
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error,
      }
    }

    let authIdentity: AuthIdentityDTO | undefined

    try {
      const passwordHash = await this.hashPassword(password)

      authIdentity = await authIdentityService.update(entity_id, {
        provider_metadata: {
          password: passwordHash,
        },
      })
    } catch (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      authIdentity,
    }
  }

  async authenticate(
    userData: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const validation = this.validateAuthenticationInput(userData.body as AuthenticationBody | undefined)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const normalizedEmail = validation.normalizedEmail!
    const { password } = userData.body ?? {}

    let authIdentity: AuthIdentityDTO | undefined

    try {
      authIdentity = await authIdentityService.retrieve({
        entity_id: normalizedEmail,
      })
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        return {
          success: false,
          error: "Invalid email or password",
        }
      }

      return { success: false, error: error.message }
    }

    const providerIdentity = authIdentity.provider_identities?.find(
      (pi) => pi.provider === this.provider
    )!
    const passwordHash = providerIdentity.provider_metadata?.password

    if (isString(passwordHash)) {
      const buf = Buffer.from(passwordHash as string, "base64")
      const success = await Scrypt.verify(buf, password)

      if (success) {
        const copy = JSON.parse(JSON.stringify(authIdentity))
        const providerIdentity = copy.provider_identities?.find(
          (pi) => pi.provider === this.provider
        )!
        delete providerIdentity.provider_metadata?.password

        return {
          success,
          authIdentity: copy,
        }
      }
    }

    return {
      success: false,
      error: "Invalid email or password",
    }
  }

  async register(
    userData: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const validation = this.validateRegistrationInput(userData.body as RegistrationBody | undefined)
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      }
    }

    const normalizedEmail = validation.normalizedEmail!
    const { password } = userData.body ?? {}

    try {
      const identity = await authIdentityService.retrieve({
        entity_id: normalizedEmail,
      })

      const existingProviderIdentity = identity.provider_identities?.find(
        (pi) => pi.provider === this.identifier
      )

      if (existingProviderIdentity) {
        throw new MedusaError(
          MedusaError.Types.DUPLICATE_ERROR,
          "It seems the email you entered is already associated with another account. Please log in instead."
        )
      }

      // If app_metadata is not defined or empty, it means no actor was assigned to the auth_identity yet (still "claimable")
      if (!isPresent(identity.app_metadata)) {
        const updatedAuthIdentity = await this.upsertAuthIdentity('update', {
          email: normalizedEmail,
          password,
          authIdentityService,
        })

        return {
          success: true,
          authIdentity: updatedAuthIdentity,
        }
      }

      throw new MedusaError(
        MedusaError.Types.DUPLICATE_ERROR,
        "It seems the email you entered is already associated with another account. Please log in instead."
      )
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await this.upsertAuthIdentity('create', {
          email: normalizedEmail,
          password,
          authIdentityService,
        })

        return {
          success: true,
          authIdentity: createdAuthIdentity,
        }
      }

      if (error instanceof MedusaError) {
        throw error
      }

      return { success: false, error: error.message }
    }
  }

  private async upsertAuthIdentity(type: 'update' | 'create', { email, password, authIdentityService }: AuthIdentityParams) {
    const passwordHash = await this.hashPassword(password)

    const authIdentity: AuthIdentityDTO | undefined = type === 'create' ? await authIdentityService.create({
        entity_id: email,
        provider_metadata: {
          password: passwordHash,
        },
      }) : await authIdentityService.update(email, {
      provider_metadata: {
        password: passwordHash,
      },
    })

    const copy: AuthIdentityDTO = JSON.parse(JSON.stringify(authIdentity))
    const providerIdentity = copy.provider_identities?.find(
      (pi) => pi.provider === this.provider
    )!
    delete providerIdentity.provider_metadata?.password

    return copy
  }
}

export default EmailPasswordAuthService
