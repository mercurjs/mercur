import { ExecArgs } from '@medusajs/framework/types'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresWorkflow
} from '@medusajs/medusa/core-flows'

export default async function seedMarketplaceData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  const storeModuleService = container.resolve(Modules.STORE)

  const countries = ['gb', 'de', 'dk', 'se', 'fr', 'es', 'it']

  logger.info('Seeding store data...')
  const [store] = await storeModuleService.listStores()
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: 'Default Sales Channel'
  })

  if (!defaultSalesChannel.length) {
    // create the default sales channel
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: 'Default Sales Channel'
          }
        ]
      }
    })
    defaultSalesChannel = salesChannelResult
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        /**
         * Here we are adding the supported currencies and setting the default one
         * You can change the currencies and the default one as you want
         */

        supported_currencies: [
          {
            currency_code: 'eur',
            is_default: true
          }
        ],
        default_sales_channel_id: defaultSalesChannel[0].id
      }
    }
  })
  logger.info('Seeding region data...')
  await createRegionsWorkflow(container).run({
    input: {
      regions: [
        /**
         * Here you can change regions and their currencies
         * They will be used in the storefront
         */

        {
          name: 'Europe',
          currency_code: 'eur',
          countries,
          payment_providers: ['pp_system_default']
        }
      ]
    }
  })

  logger.info('Seeding tax regions...')
  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code
    }))
  })

  logger.info('Seeding fulfillment data...')

  await createShippingProfilesWorkflow(container).run({
    input: {
      data: [
        {
          name: 'Default',
          type: 'default'
        }
      ]
    }
  })

  logger.info('Seeding publishable API key data...')
  const { result: publishableApiKeyResult } = await createApiKeysWorkflow(
    container
  ).run({
    input: {
      api_keys: [
        {
          title: 'Marketplace Webshop',
          type: 'publishable',
          created_by: ''
        }
      ]
    }
  })
  const publishableApiKey = publishableApiKeyResult[0]

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: publishableApiKey.id,
      add: [defaultSalesChannel[0].id]
    }
  })

  logger.info('Seeding product category data...')

  await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        {
          name: 'Shirts',
          is_active: true
        },
        {
          name: 'Sweatshirts',
          is_active: true
        },
        {
          name: 'Pants',
          is_active: true
        },
        {
          name: 'Merch',
          is_active: true
        }
      ]
    }
  })
}
