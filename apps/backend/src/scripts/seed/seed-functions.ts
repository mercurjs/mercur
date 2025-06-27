import { MedusaContainer } from '@medusajs/framework'
import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  updateStoresWorkflow
} from '@medusajs/medusa/core-flows'

import {
  CONFIGURATION_MODULE,
  ConfigurationModuleService,
  ConfigurationRuleDefaults
} from '@mercurjs/configuration'
import { SELLER_MODULE } from '@mercurjs/seller'

import sellerShippingProfile from '../../links/seller-shipping-profile'
import { createCommissionRuleWorkflow } from '../../workflows/commission/workflows'
import { createConfigurationRuleWorkflow } from '../../workflows/configuration/workflows'
import { createLocationFulfillmentSetAndAssociateWithSellerWorkflow } from '../../workflows/fulfillment-set/workflows'
import { createSellerWorkflow } from '../../workflows/seller/workflows'
import { productsToInsert } from './seed-products'

const countries = ['be', 'de', 'dk', 'se', 'fr', 'es', 'it', 'pl', 'cz', 'nl']

export async function createSalesChannel(container: MedusaContainer) {
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL)
  let [defaultSalesChannel] = await salesChannelModuleService.listSalesChannels(
    {
      name: 'Default Sales Channel'
    }
  )

  if (!defaultSalesChannel) {
    const {
      result: [salesChannelResult]
    } = await createSalesChannelsWorkflow(container).run({
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

  return defaultSalesChannel
}

export async function createStore(
  container: MedusaContainer,
  salesChannelId: string,
  regionId: string
) {
  const storeModuleService = container.resolve(Modules.STORE)
  const [store] = await storeModuleService.listStores()

  if (!store) {
    return
  }

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        supported_currencies: [
          {
            currency_code: 'eur',
            is_default: true
          }
        ],
        default_sales_channel_id: salesChannelId,
        default_region_id: regionId
      }
    }
  })
}
export async function createRegions(container: MedusaContainer) {
  const {
    result: [region]
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: 'Europe',
          currency_code: 'eur',
          countries,
          payment_providers: ['pp_system_default']
        }
      ]
    }
  })

  await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code
    }))
  })

  return region
}

export async function createPublishableKey(
  container: MedusaContainer,
  salesChannelId: string
) {
  const apiKeyService = container.resolve(Modules.API_KEY)

  let [key] = await apiKeyService.listApiKeys({ type: 'publishable' })

  if (!key) {
    const {
      result: [publishableApiKeyResult]
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: 'Default publishable key',
            type: 'publishable',
            created_by: ''
          }
        ]
      }
    })
    key = publishableApiKeyResult
  }

  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: {
      id: key.id,
      add: [salesChannelId]
    }
  })

  return key
}

export async function createProductCategories(container: MedusaContainer) {
  const { result } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [
        {
          name: 'Sneakers',
          is_active: true
        },
        {
          name: 'Sandals',
          is_active: true
        },
        {
          name: 'Boots',
          is_active: true
        },
        {
          name: 'Sport',
          is_active: true
        },
        {
          name: 'Accessories',
          is_active: true
        },
        {
          name: 'Tops',
          is_active: true
        }
      ]
    }
  })

  return result
}

export async function createProductCollections(container: MedusaContainer) {
  const { result } = await createCollectionsWorkflow(container).run({
    input: {
      collections: [
        {
          title: 'Luxury'
        },
        {
          title: 'Vintage'
        },
        {
          title: 'Casual'
        },
        {
          title: 'Soho'
        },
        {
          title: 'Streetwear'
        },
        {
          title: 'Y2K'
        }
      ]
    }
  })

  return result
}

export async function createSeller(container: MedusaContainer) {
  const authService = container.resolve(Modules.AUTH)

  const { authIdentity } = await authService.register('emailpass', {
    body: {
      email: 'seller@mercurjs.com',
      password: 'secret'
    }
  })

  const { result: seller } = await createSellerWorkflow.run({
    container,
    input: {
      auth_identity_id: authIdentity?.id,
      member: {
        name: 'John Doe',
        email: 'seller@mercurjs.com'
      },
      seller: {
        name: 'MercurJS Store'
      }
    }
  })

  return seller
}

export async function createSellerStockLocation(
  container: MedusaContainer,
  sellerId: string,
  salesChannelId: string
) {
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const {
    result: [stock]
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: `Stock Location for seller ${sellerId}`,
          address: {
            address_1: 'Random Strasse',
            city: 'Berlin',
            country_code: 'de'
          }
        }
      ]
    }
  })

  await link.create([
    {
      [SELLER_MODULE]: {
        seller_id: sellerId
      },
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stock.id
      }
    },
    {
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stock.id
      },
      [Modules.FULFILLMENT]: {
        fulfillment_provider_id: 'manual_manual'
      }
    },
    {
      [Modules.SALES_CHANNEL]: {
        sales_channel_id: salesChannelId
      },
      [Modules.STOCK_LOCATION]: {
        stock_location_id: stock.id
      }
    }
  ])

  await createLocationFulfillmentSetAndAssociateWithSellerWorkflow.run({
    container,
    input: {
      fulfillment_set_data: {
        name: `${sellerId} fulfillment set`,
        type: 'shipping'
      },
      location_id: stock.id,
      seller_id: sellerId
    }
  })

  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [stockLocation]
  } = await query.graph({
    entity: 'stock_location',
    fields: ['*', 'fulfillment_sets.*'],
    filters: {
      id: stock.id
    }
  })

  return stockLocation
}

export async function createServiceZoneForFulfillmentSet(
  container: MedusaContainer,
  sellerId: string,
  fulfillmentSetId: string
) {
  await createServiceZonesWorkflow.run({
    container,
    input: {
      data: [
        {
          fulfillment_set_id: fulfillmentSetId,
          name: `Europe`,
          geo_zones: countries.map((c) => ({
            type: 'country',
            country_code: c
          }))
        }
      ]
    }
  })

  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  const [zone] = await fulfillmentService.listServiceZones({
    fulfillment_set: {
      id: fulfillmentSetId
    }
  })

  const link = container.resolve(ContainerRegistrationKeys.LINK)
  await link.create({
    [SELLER_MODULE]: {
      seller_id: sellerId
    },
    [Modules.FULFILLMENT]: {
      service_zone_id: zone.id
    }
  })

  return zone
}

export async function createSellerShippingOption(
  container: MedusaContainer,
  sellerId: string,
  sellerName: string,
  regionId: string,
  serviceZoneId: string
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [shippingProfile]
  } = await query.graph({
    entity: sellerShippingProfile.entryPoint,
    fields: ['shipping_profile_id'],
    filters: {
      seller_id: sellerId
    }
  })

  const {
    result: [shippingOption]
  } = await createShippingOptionsWorkflow.run({
    container,
    input: [
      {
        name: `${sellerName} shipping`,
        shipping_profile_id: shippingProfile.shipping_profile_id,
        service_zone_id: serviceZoneId,
        provider_id: 'manual_manual',
        type: {
          label: `${sellerName} shipping`,
          code: sellerName,
          description: 'Europe shipping'
        },
        rules: [
          { value: 'true', attribute: 'enabled_in_store', operator: 'eq' },
          { attribute: 'is_return', value: 'false', operator: 'eq' }
        ],
        prices: [
          { currency_code: 'eur', amount: 10 },
          { amount: 10, region_id: regionId }
        ],
        price_type: 'flat',
        data: { id: 'manual-fulfillment' }
      }
    ]
  })

  const link = container.resolve(ContainerRegistrationKeys.LINK)
  await link.create({
    [SELLER_MODULE]: {
      seller_id: sellerId
    },
    [Modules.FULFILLMENT]: {
      shipping_option_id: shippingOption.id
    }
  })

  return shippingOption
}

export async function createSellerProducts(
  container: MedusaContainer,
  sellerId: string,
  salesChannelId: string
) {
  const productService = container.resolve(Modules.PRODUCT)
  const collections = await productService.listProductCollections(
    {},
    { select: ['id', 'title'] }
  )
  const categories = await productService.listProductCategories(
    {},
    { select: ['id', 'name'] }
  )

  const randomCategory = () =>
    categories[Math.floor(Math.random() * categories.length)]
  const randomCollection = () =>
    collections[Math.floor(Math.random() * collections.length)]

  const toInsert = productsToInsert.map((p) => ({
    ...p,
    categories: [
      {
        id: randomCategory().id
      }
    ],
    collection_id: randomCollection().id,
    sales_channels: [
      {
        id: salesChannelId
      }
    ]
  }))

  const { result } = await createProductsWorkflow.run({
    container,
    input: {
      products: toInsert,
      additional_data: {
        seller_id: sellerId
      }
    }
  })

  return result
}

export async function createInventoryItemStockLevels(
  container: MedusaContainer,
  stockLocationId: string
) {
  const inventoryService = container.resolve(Modules.INVENTORY)
  const items = await inventoryService.listInventoryItems(
    {},
    { select: ['id'] }
  )

  const toCreate = items.map((i) => ({
    inventory_item_id: i.id,
    location_id: stockLocationId,
    stocked_quantity: Math.floor(Math.random() * 50) + 1
  }))

  const { result } = await createInventoryLevelsWorkflow.run({
    container,
    input: {
      inventory_levels: toCreate
    }
  })
  return result
}

export async function createDefaultCommissionLevel(container: MedusaContainer) {
  await createCommissionRuleWorkflow.run({
    container,
    input: {
      name: 'default',
      is_active: true,
      reference: 'site',
      reference_id: '',
      rate: {
        include_tax: true,
        type: 'percentage',
        percentage_rate: 2
      }
    }
  })
}

export async function createConfigurationRules(container: MedusaContainer) {
  const configurationService =
    container.resolve<ConfigurationModuleService>(CONFIGURATION_MODULE)

  for (const [ruleType, isEnabled] of ConfigurationRuleDefaults) {
    const [existingRule] = await configurationService.listConfigurationRules({
      rule_type: ruleType
    })

    if (!existingRule) {
      await createConfigurationRuleWorkflow.run({
        container,
        input: {
          rule_type: ruleType,
          is_enabled: isEnabled
        }
      })
    }
  }
}
