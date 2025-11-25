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
  updateStoresWorkflow,
  updateTaxRegionsWorkflow
} from '@medusajs/medusa/core-flows'

import { SELLER_MODULE } from '@mercurjs/b2c-core/modules/seller'
import { CONFIGURATION_MODULE } from '@mercurjs/b2c-core/modules/configuration'
import { COMMISSION_MODULE } from '@mercurjs/commission/modules/commission'
import {
  createConfigurationRuleWorkflow,
  createLocationFulfillmentSetAndAssociateWithSellerWorkflow,
  createSellerWorkflow
} from '@mercurjs/b2c-core/workflows'
import { createCommissionRuleWorkflow } from '@mercurjs/commission/workflows'
import {
  ConfigurationRuleDefaults,
  SELLER_SHIPPING_PROFILE_LINK
} from '@mercurjs/framework'

import { productsToInsert } from './seed-products'
import { PRODUCT_TYPE_TO_CATEGORY } from '../../lib/category-mapping'

const countries = ['gb']

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
        default_sales_channel_id: salesChannelId,
        default_region_id: regionId,
        supported_currencies: [
          {
            currency_code: 'gbp',
            is_default: true
          }
        ]
      }
    }
  })
}
export async function createRegions(container: MedusaContainer) {
  const regionService = container.resolve(Modules.REGION)
  
  // Check if region already exists
  const existingRegions = await regionService.listRegions({ name: 'United Kingdom' })
  if (existingRegions && existingRegions.length > 0) {
    console.log('Region "United Kingdom" already exists, skipping creation')
    return existingRegions[0]
  }

  const {
    result: [region]
  } = await createRegionsWorkflow(container).run({
    input: {
      regions: [
        {
          name: 'United Kingdom',
          currency_code: 'gbp',
          countries,
          payment_providers: ['pp_system_default']
        }
      ]
    }
  })

  const { result: taxRegions } = await createTaxRegionsWorkflow(container).run({
    input: countries.map((country_code) => ({
      country_code
    }))
  })

  await updateTaxRegionsWorkflow(container).run({
    input: taxRegions.map((taxRegion) => ({
      id: taxRegion.id,
      provider_id: 'tp_system'
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
  const productModule = container.resolve(Modules.PRODUCT)
  
  // Build category hierarchy from mapping
  const categoryHierarchy = new Map<string, Set<string>>() // level1 -> level2[]
  const subcategoryHierarchy = new Map<string, Set<string>>() // level2 -> level3[]
  
  for (const [productType, mapping] of Object.entries(PRODUCT_TYPE_TO_CATEGORY)) {
    // Add level1
    if (!categoryHierarchy.has(mapping.level1)) {
      categoryHierarchy.set(mapping.level1, new Set())
    }
    categoryHierarchy.get(mapping.level1)!.add(mapping.level2)
    
    // Add level2 -> level3
    const level2Key = `${mapping.level1}::${mapping.level2}`
    if (!subcategoryHierarchy.has(level2Key)) {
      subcategoryHierarchy.set(level2Key, new Set())
    }
    subcategoryHierarchy.get(level2Key)!.add(mapping.level3)
  }

  // Helper to generate handle
  const toHandle = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  // Check existing categories
  const existingCategories = await productModule.listProductCategories({}, { take: 9999 })
  const existingByName = new Map(existingCategories.map((c: any) => [c.name, c]))
  const existingByHandle = new Set(existingCategories.map((c: any) => c.handle))

  console.log(`Found ${existingCategories.length} existing categories`)

  // Level 1: Create all top-level categories
  const level1ToCreate = Array.from(categoryHierarchy.keys()).filter(name => {
    const hasName = existingByName.has(name)
    const handle = toHandle(name)
    const hasHandle = existingByHandle.has(handle)
    if (hasName || hasHandle) {
      console.log(`   ℹ️  Skipping "${name}" (handle: ${handle}, hasName: ${hasName}, hasHandle: ${hasHandle})`)
    }
    return !hasName && !hasHandle
  })
  
  if (level1ToCreate.length > 0) {
    const { result: level1Result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: level1ToCreate.map(name => ({
          name,
          handle: toHandle(name),
          is_active: true,
          is_internal: false
        }))
      }
    })
    console.log(`✅ Created ${level1Result.length} level 1 categories`)
    level1Result.forEach((c: any) => {
      existingByName.set(c.name, c)
      existingByHandle.add(c.handle)
    })
  } else {
    console.log(`ℹ️  All level 1 categories already exist`)
  }

  // Level 2: Create all subcategories
  const level2ToCreate: Array<{ name: string; parent: string }> = []
  
  for (const [level1Name, level2Names] of categoryHierarchy.entries()) {
    const parentCategory = existingByName.get(level1Name)
    if (!parentCategory) {
      console.warn(`⚠️  Parent category "${level1Name}" not found, skipping subcategories`)
      continue
    }
    
    for (const level2Name of level2Names) {
      if (!existingByName.has(level2Name) && !existingByHandle.has(toHandle(level2Name))) {
        level2ToCreate.push({ name: level2Name, parent: parentCategory.id })
      }
    }
  }

  if (level2ToCreate.length > 0) {
    const { result: level2Result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: level2ToCreate.map(({ name, parent }) => ({
          name,
          handle: toHandle(name),
          parent_category_id: parent,
          is_active: true,
          is_internal: false
        }))
      }
    })
    console.log(`✅ Created ${level2Result.length} level 2 categories`)
    level2Result.forEach((c: any) => {
      existingByName.set(c.name, c)
      existingByHandle.add(c.handle)
    })
  } else {
    console.log(`ℹ️  All level 2 categories already exist`)
  }

  // Level 3: Create all product type categories
  const level3ToCreate: Array<{ name: string; parent: string }> = []
  
  for (const [level2Key, level3Names] of subcategoryHierarchy.entries()) {
    const [level1Name, level2Name] = level2Key.split('::')
    const parentCategory = existingByName.get(level2Name)
    
    if (!parentCategory) {
      console.warn(`⚠️  Parent category "${level2Name}" not found, skipping product types`)
      continue
    }
    
    for (const level3Name of level3Names) {
      if (!existingByName.has(level3Name) && !existingByHandle.has(toHandle(level3Name))) {
        level3ToCreate.push({ name: level3Name, parent: parentCategory.id })
      }
    }
  }

  if (level3ToCreate.length > 0) {
    // Create in batches to avoid overwhelming the system
    const batchSize = 50
    let totalCreated = 0
    
    for (let i = 0; i < level3ToCreate.length; i += batchSize) {
      const batch = level3ToCreate.slice(i, i + batchSize)
      const { result: level3Result } = await createProductCategoriesWorkflow(container).run({
        input: {
          product_categories: batch.map(({ name, parent }) => ({
            name,
            handle: toHandle(name),
            parent_category_id: parent,
            is_active: true,
            is_internal: false
          }))
        }
      })
      totalCreated += level3Result.length
      level3Result.forEach((c: any) => {
        existingByName.set(c.name, c)
        existingByHandle.add(c.handle)
      })
      console.log(`   Created ${totalCreated}/${level3ToCreate.length} level 3 categories...`)
    }
    console.log(`✅ Created ${totalCreated} level 3 categories`)
  } else {
    console.log(`ℹ️  All level 3 categories already exist`)
  }

  const finalCategories = await productModule.listProductCategories({}, { take: 9999 })
  console.log(`✅ Total categories in database: ${finalCategories.length}`)

  return finalCategories
}

export async function createProductCollections(container: MedusaContainer) {
  const productModule = container.resolve(Modules.PRODUCT)
  
  // Check if collections already exist
  const existingCollections = await productModule.listProductCollections({})
  if (existingCollections && existingCollections.length > 0) {
    console.log('Product collections already exist, skipping creation')
    return existingCollections
  }

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

export async function createProductTypes(container: MedusaContainer) {
  const productModule = container.resolve(Modules.PRODUCT)
  
  // Get all unique product types from category mapping
  const productTypes = Object.keys(PRODUCT_TYPE_TO_CATEGORY)

  const existingTypes = await productModule.listProductTypes({})
  const existingTypeValues = new Set(existingTypes.map((type: any) => type.value))

  const createdTypes: any[] = []
  let skippedCount = 0

  for (const type of productTypes) {
    if (!existingTypeValues.has(type)) {
      const created = await productModule.createProductTypes({
        value: type
      })
      createdTypes.push(created)
    } else {
      skippedCount++
    }
  }

  if (createdTypes.length > 0) {
    console.log(`✅ Created ${createdTypes.length} product types`)
  }
  if (skippedCount > 0) {
    console.log(`ℹ️  Skipped ${skippedCount} existing product types`)
  }

  return [...existingTypes, ...createdTypes]
}

export async function createSeller(container: MedusaContainer) {
  const authService = container.resolve(Modules.AUTH)
  const sellerService = container.resolve(SELLER_MODULE) as any

  // Check if seller already exists by handle
  const existingSellers = await sellerService.listSellers({ handle: 'mercurjs-store' })
  if (existingSellers && existingSellers.length > 0) {
    console.log('Seller already exists, skipping creation')
    return existingSellers[0]
  }

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
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  
  // Check if stock location already exists for this seller
  const {
    data: existingStockLocations
  } = await query.graph({
    entity: 'stock_location',
    fields: ['*', 'fulfillment_sets.*'],
    filters: {
      name: `Stock Location for seller ${sellerId}`
    }
  })
  
  if (existingStockLocations && existingStockLocations.length > 0) {
    console.log('Stock location for seller already exists, skipping creation')
    return existingStockLocations[0]
  }

  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const {
    result: [stock]
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: `Stock Location for seller ${sellerId}`,
          address: {
            address_1: 'Oxford Street',
            city: 'London',
            country_code: 'gb',
            postal_code: 'W1D 1BS'
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
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  // Check if service zone already exists for this fulfillment set
  const existingZones = await fulfillmentService.listServiceZones({
    fulfillment_set: {
      id: fulfillmentSetId
    }
  })
  
  if (existingZones && existingZones.length > 0) {
    console.log('Service zone for fulfillment set already exists, skipping creation')
    return existingZones[0]
  }

  await createServiceZonesWorkflow.run({
    container,
    input: {
      data: [
        {
          fulfillment_set_id: fulfillmentSetId,
          name: `United Kingdom`,
          geo_zones: countries.map((c) => ({
            type: 'country',
            country_code: c
          }))
        }
      ]
    }
  })

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
    entity: SELLER_SHIPPING_PROFILE_LINK,
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
          { currency_code: 'gbp', amount: 10 },
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
  
  // Check if products already exist
  const existingProducts = await productService.listProducts({})
  if (existingProducts && existingProducts.length > 0) {
    console.log('Products already exist, skipping creation')
    return existingProducts
  }

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
  
  // Check if inventory levels already exist
  const existingLevels = await inventoryService.listInventoryLevels({
    location_id: stockLocationId
  })
  if (existingLevels && existingLevels.length > 0) {
    console.log('Inventory levels already exist, skipping creation')
    return existingLevels
  }

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
  const commissionService = container.resolve(COMMISSION_MODULE) as any
  
  // Check if default commission rule already exists
  const existingRules = await commissionService.listCommissionRules({ name: 'default' })
  if (existingRules && existingRules.length > 0) {
    console.log('Default commission rule already exists, skipping creation')
    return
  }

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

export async function createAdminUser(container: MedusaContainer) {
  const userService = container.resolve(Modules.USER)
  const authService = container.resolve(Modules.AUTH)
  
  // Check if admin user already exists
  const existingUsers = await userService.listUsers({ email: 'admin@medusa-test.com' })
  if (existingUsers && existingUsers.length > 0) {
    console.log('Admin user already exists, skipping creation')
    return existingUsers[0]
  }

  // Create auth identity first
  const { authIdentity } = await authService.register('emailpass', {
    body: {
      email: 'admin@medusa-test.com',
      password: 'supersecret'
    }
  })

  // Create user linked to auth identity
  const user = await userService.createUsers({
    email: 'admin@medusa-test.com',
    first_name: 'Admin',
    last_name: 'User',
    metadata: {
      auth_identity_id: authIdentity?.id
    }
  })

  console.log('✅ Admin user created: admin@medusa-test.com')
  return user
}

export async function createConfigurationRules(container: MedusaContainer) {
  const configurationService = container.resolve(CONFIGURATION_MODULE) as any
  
  // Get existing configuration rules
  const existingRules = await configurationService.listConfigurationRules({})
  const existingRuleTypes = new Set(existingRules.map((rule: any) => rule.rule_type))
  
  for (const [ruleType, isEnabled] of ConfigurationRuleDefaults) {
    // Skip if rule already exists
    if (existingRuleTypes.has(ruleType)) {
      console.log(`Configuration rule "${ruleType}" already exists, skipping`)
      continue
    }
    
    await createConfigurationRuleWorkflow.run({
      container,
      input: {
        rule_type: ruleType,
        is_enabled: isEnabled
      }
    })
  }
}
