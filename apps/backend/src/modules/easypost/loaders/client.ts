import EasyPost from '@easypost/api/types/EasyPost'
import { asValue } from 'awilix'
import { z } from 'zod'

import { LoaderOptions } from '@medusajs/framework/types'
import { MedusaError } from '@medusajs/framework/utils'

import mockClient from './mock-client'
import { GetAccountsResponse } from './validators'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Client = require('@easypost/api')

export type GetAccountsResponse = z.infer<typeof GetAccountsResponse>

export interface IEasyPostClient {
  getCarrierAccounts: () => Promise<GetAccountsResponse>
}

export class EasyPostClient implements IEasyPostClient {
  private client_: EasyPost
  private static instance: EasyPostClient

  private constructor(opts: ModuleOptions) {
    this.client_ = new Client(opts?.apiKey)
  }

  public static getInstance(opts?: ModuleOptions): EasyPostClient {
    if (opts?.mockEasyPostClient) {
      EasyPostClient.instance = mockClient as unknown as EasyPostClient
      return EasyPostClient.instance
    }

    if (!EasyPostClient.instance && opts?.apiKey) {
      EasyPostClient.instance = new EasyPostClient(opts)
    }

    if (!EasyPostClient.instance && !opts) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        'apiKey for EasyPost is required'
      )
    }

    return EasyPostClient.instance
  }

  async getCarrierAccounts() {
    try {
      const response = await this.client_.CarrierAccount.all()
      const accounts = GetAccountsResponse.parse(response)
      return accounts
    } catch {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        'Incorrect EasyPost get carriers accounts response'
      )
    }
  }
}

export type ModuleOptions = {
  apiKey: string
  mockEasyPostClient: boolean
}

export default async function easyPostClientLoader({
  container,
  options
}: LoaderOptions<ModuleOptions>): Promise<void> {
  const logger = container.resolve('logger')

  if (!options?.apiKey) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      'apiKey for EasyPost is required'
    )
  }
  try {
    const client = EasyPostClient.getInstance(options)
    logger.info(
      `Connected to EasyPost ${options.mockEasyPostClient ? 'with mocked-client. Turn off in medusa-config file.' : 'with live client.'}`
    )
    container.register('easyPostClient', asValue(client))
  } catch (e) {
    logger.error(
      `[EASYPOST MODULE]: An error occurred while connecting to EasyPost: ${e}`
    )
  }
}
