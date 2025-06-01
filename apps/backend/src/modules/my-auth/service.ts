import axios from 'axios'
import crypto from 'crypto'

import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
  Logger
} from '@medusajs/framework/types'
import {
  AbstractAuthModuleProvider,
  MedusaError
} from '@medusajs/framework/utils'

import { OAUTH2_URL } from '../../lib/constants'

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  callbackUrl: string
  clientId: string
}

type TokenResponse = {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token: string
}

// interface MyAuthProviderService extends GoogleAuthProviderOptions {}
class MyAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = 'my-auth'
  static DISPLAY_NAME = 'My Auth'

  //   protected config_: MyAuthProviderService;
  protected logger_: Logger
  //   protected options_: Options;
  protected config_: Options

  static validateOptions(options: Options) {
    if (!options.clientId) {
      throw new Error('My Auth clientId is required')
    }

    if (!options.callbackUrl) {
      throw new Error('My Auth callbackUrl is required')
    }
  }

  constructor(
    { logger }: InjectedDependencies,
    // options: GoogleAuthProviderOptions,
    options: Options
  ) {
    // @ts-ignore
    super(...arguments)
    this.config_ = options
    this.logger_ = logger
    // this.options_ = options;
  }

  async register(_): Promise<AuthenticationResponse> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'Google does not support registration. Use method `authenticate` instead.'
    )
  }

  async authenticate(
    req: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query: Record<string, string> = req.query ?? {}
    const body: Record<string, string> = req.body ?? {}

    if (query.error) {
      return {
        success: false,
        error: `${query.error_description}, read more at: ${query.error_uri}`
      }
    }

    const stateKey = crypto.randomBytes(32).toString('hex')
    const state = {
      callback_url: body?.callback_url ?? this.config_.callbackUrl
    }

    await authIdentityService.setState(stateKey, state)
    return this.getRedirect(this.config_.clientId, state.callback_url, stateKey)
  }

  async validateCallback(
    req: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query: Record<string, string> = req.query ?? {}
    const body: Record<string, string> = req.body ?? {}

    if (query.error) {
      return {
        success: false,
        error: `${query.error_description}, read more at: ${query.error_uri}`
      }
    }

    const code = query?.code ?? body?.code
    if (!code) {
      return { success: false, error: 'No code provided' }
    }

    const state = await authIdentityService.getState(query?.state as string)
    if (!state) {
      return { success: false, error: 'No state provided, or session expired' }
    }

    try {
      const data = {
        code,
        client_id: this.config_.clientId,
        redirect_uri: state.callback_url,
        grant_type: 'authorization_code'
      }

      const response = await axios
        .post(`${OAUTH2_URL}/oauth/authenticate`, data)
        .then((r) => {
          if (!r.status) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Could not exchange token, ${r.status}, ${r.statusText}`
            )
          }

          return r.data
        })

      console.log('Token Response:', response)

      const { authIdentity, success } = await this.verify_(
        response as TokenResponse,
        authIdentityService
      )

      return {
        success,
        authIdentity
      }
    } catch (error) {
      console.log('Error in validateCallback:', error)
      return { success: false, error: error.message }
    }
  }

  async verify_(
    Token: TokenResponse | undefined,
    authIdentityService: AuthIdentityProviderService
  ) {
    if (!Token) {
      return { success: false, error: 'No ID found' }
    }

    const response = await axios
      .get(`${OAUTH2_URL}/oauth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${Token.token_type} ${Token.access_token}`
        }
      })
      .then((r) => {
        if (!r.status) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Could not get current user, ${r.status}, ${r.statusText}`
          )
        }

        return r.data
      })

    const payload = response // Assuming response contains user data
    const userMetadata = {
      name: payload.name,
      email: payload.email,
      picture: payload.avatar_url,
      given_name: `${payload.firstname} ${payload.lastname}`,
      family_name: '-',
      wallet: payload.wallet
    }

    let authIdentity

    try {
      authIdentity = await authIdentityService.retrieve({
        entity_id: payload.id
      })
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await authIdentityService.create({
          entity_id: payload.id,
          user_metadata: userMetadata
        })
        authIdentity = createdAuthIdentity
      } else {
        return { success: false, error: error.message }
      }
    }

    return {
      success: true,
      authIdentity
    }
  }

  private getRedirect(clientId: string, callbackUrl: string, stateKey: string) {
    const authUrl = new URL(`${OAUTH2_URL}/oauth/authorize`)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set(
      'scope',
      'basic email photo profile profiles wallet'
    )
    authUrl.searchParams.set('state', stateKey)

    return { success: true, location: authUrl.toString() }
  }
}

export default MyAuthProviderService
