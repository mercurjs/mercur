import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys } from '@medusajs/framework/utils'

import {
  createConfigurationRules,
  createDefaultCommissionLevel,
  createInventoryItemStockLevels,
  createProductCategories,
  createProductCollections,
  createPublishableKey,
  createRegions,
  createSalesChannel,
  createSeller,
  createSellerProducts,
  createSellerShippingOption,
  createSellerStockLocation,
  createServiceZoneForFulfillmentSet,
  createStore
} from './seed/seed-functions'

export default async function seedMarketplaceData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info('=== Configurations ===')
  logger.info('Creating default sales channel...')
  const salesChannel = await createSalesChannel(container)
  logger.info('Creating default regions...')
  const region = await createRegions(container)
  logger.info('Creating publishable api key...')
  const apiKey = await createPublishableKey(container, salesChannel.id)
  logger.info('Creating store data...')
  await createStore(container, salesChannel.id, region.id)
  logger.info('Creating configuration rules...')
  await createConfigurationRules(container)

  logger.info('=== Example data ===')
  logger.info('Creating product categories...')
  await createProductCategories(container)
  logger.info('Creating product collections...')
  await createProductCollections(container)
  logger.info('Creating seller...')
  const sellers = await createSeller(container)
  for (const seller of sellers) {
    logger.info(`Creating seller stock locations for ${seller.name}...`)
    const stockLocation = await createSellerStockLocation(
      container,
      seller,
      salesChannel.id
    )
    logger.info(`Creating service zone for ${seller.name}...`)
    const serviceZone = await createServiceZoneForFulfillmentSet(
      container,
      seller,
      stockLocation.fulfillment_sets[0].id
    )
    logger.info(`Creating seller shipping option for ${seller.name}...`)
    await createSellerShippingOption(
      container,
      seller.id,
      seller.name,
      region.id,
      serviceZone.id
    )
    // logger.info(`Creating seller products for ${seller.name}...`)
    // await createSellerProducts(container, seller.id, salesChannel.id)
    // logger.info(`Creating inventory levels for ${seller.name}...`)
    // await createInventoryItemStockLevels(container, stockLocation.id)
  }
  logger.info(`Creating default commission...`)
  await createDefaultCommissionLevel(container)

  logger.info('=== Finished ===')
  logger.info(`Publishable api key: ${apiKey.token}`)
  logger.info(`Vendor panel access:`)
  logger.info(`email: oddy@gmail.com`)
  logger.info(`email: karnika@gmail.com`)
  logger.info(`pass: admin`)

  logger.info(`Admin panel access: run the following command to access the admin panel`)
  logger.info(`npx medusa user --email admin@gmail.com --password admin`)
  logger.info(`email: admin@gmail.com`)
  logger.info(`pass: admin`)
}
