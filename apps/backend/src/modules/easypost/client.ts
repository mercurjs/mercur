import EasyPost, { IEasyPostOptions } from '@easypost/api/types'

import { logger } from '@medusajs/framework'
import { MedusaError } from '@medusajs/framework/utils'
import { Logger } from '@medusajs/medusa/types'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Client = require('@easypost/api')

type EasyPostClientOptions = IEasyPostOptions & {
  api_key: string
  logger: Logger
}

export const createEasyPostClient = (opts: EasyPostClientOptions): EasyPost => {
  const { api_key, ...rest_opts } = opts
  const client_ = new Client(api_key, rest_opts)

  const proxy = new Proxy(client_, {
    get(target, property) {
      console.log(`target from proxy: ${target}`)
      return (...args) =>
        target[property](...args).catch((error) => {
          logger.error(error)
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            'Request not resolved correctly by EasyPost client'
          )
        })
    }
  })

  return proxy
}
