import { LoaderOptions } from '@medusajs/framework/types'

export default async function databaseLoader({ container }: LoaderOptions) {
  const logger = container.resolve('logger')

  logger.info('Database URL: ' + process.env.DATABASE_URL)
}
