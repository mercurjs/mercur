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

import sellerShippingProfile from '../../links/seller-shipping-profile'
import { ConfigurationRuleDefaults } from '../../modules/configuration/service'
import ConfigurationModuleService from '../../modules/configuration/service'
import { SELLER_MODULE } from '../../modules/seller'
import { createCommissionRuleWorkflow } from '../../workflows/commission/workflows'
import { createConfigurationRuleWorkflow } from '../../workflows/configuration/workflows'
import { createLocationFulfillmentSetAndAssociateWithSellerWorkflow } from '../../workflows/fulfillment-set/workflows'
import { createSellerWorkflow } from '../../workflows/seller/workflows'
import { productsToInsert } from './seed-products'
import { CONFIGURATION_MODULE } from "../../modules/configuration";

const countries = ['in']

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
            currency_code: 'inr',
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
          name: 'India',
          currency_code: 'inr',
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
  // Create main categories for Men, Women, and Kids
  const mainCategories = [
    { name: "Men", is_active: true },
    { name: "Women", is_active: true },
    { name: "Kids", is_active: true },
  ];

  // Create main categories and get their IDs
  const { result: createdMainCategories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: mainCategories
    }
  });

  // Helper to get parent_category_id by name
  const getId = (name: string): string => {
    const category = createdMainCategories.find((c: any) => c.name === name);
    if (!category) {
      throw new Error(`Category ${name} not found`);
    }
    return category.id;
  };

  // Men's categories (from the new image)
  const menCategories = [
    { name: "Topwear", parent_category_id: getId("Men") },
    { name: "Bottomwear", parent_category_id: getId("Men") },
    { name: "Men's Innerwear & Sleepwear", parent_category_id: getId("Men") },
    { name: "Indian & Festive Wear", parent_category_id: getId("Men") },
    { name: "Plus Size Men", parent_category_id: getId("Men") },
  ];

  // Women's categories (from the previous image)
  const womenCategories = [
    { name: "Indian & Fusion Wear", parent_category_id: getId("Women") },
    { name: "Western Wear", parent_category_id: getId("Women") },
    { name: "Maternity", parent_category_id: getId("Women") },
    { name: "Sports & Active Wear", parent_category_id: getId("Women") },
    { name: "Women's Lingerie & Sleepwear", parent_category_id: getId("Women") },
    { name: "Plus Size Women", parent_category_id: getId("Women") },
  ];

  // Kids categories (from the new image)
  const kidsCategories = [
    { name: "Boys Clothing", parent_category_id: getId("Kids") },
    { name: "Girls Clothing", parent_category_id: getId("Kids") },
    { name: "Infants", parent_category_id: getId("Kids") },
  ];

  // Create men's, women's, and kids categories
  const { result: createdSubCategories } = await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [...menCategories, ...womenCategories, ...kidsCategories]
    }
  });

  // Helper to find category ID by name and parent ID
  const getCategoryId = (name: string, parentId: string): string => {
    const category = createdSubCategories.find((c: any) => c.name === name && c.parent_category_id === parentId);
    if (!category) {
      throw new Error(`Subcategory ${name} with parent ${parentId} not found`);
    }
    return category.id;
  };

  // Men's subcategories based on the new image
  const menSubCats = [
    // Topwear
    { name: "Men's T-Shirts", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Casual Shirts", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Formal Shirts", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Sweatshirts", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Sweaters", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Men's Jackets", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Blazers & Coats", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Suits", parent_category_id: getCategoryId("Topwear", getId("Men")) },
    { name: "Rain Jackets", parent_category_id: getCategoryId("Topwear", getId("Men")) },

    // Bottomwear
    { name: "Men's Jeans", parent_category_id: getCategoryId("Bottomwear", getId("Men")) },
    { name: "Casual Trousers", parent_category_id: getCategoryId("Bottomwear", getId("Men")) },
    { name: "Formal Trousers", parent_category_id: getCategoryId("Bottomwear", getId("Men")) },
    { name: "Men's Shorts", parent_category_id: getCategoryId("Bottomwear", getId("Men")) },
    { name: "Track Pants & Joggers", parent_category_id: getCategoryId("Bottomwear", getId("Men")) },

    // Innerwear & Sleepwear
    { name: "Briefs & Trunks", parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId("Men")) },
    { name: "Boxers", parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId("Men")) },
    { name: "Vests", parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId("Men")) },
    { name: "Men's Sleepwear", parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId("Men")) },
    { name: "Men's Thermals", parent_category_id: getCategoryId("Men's Innerwear & Sleepwear", getId("Men")) },

    // Indian & Festive Wear
    { name: "Kurtas & Kurta Sets", parent_category_id: getCategoryId("Indian & Festive Wear", getId("Men")) },
    { name: "Sherwanis", parent_category_id: getCategoryId("Indian & Festive Wear", getId("Men")) },
    { name: "Nehru Jackets", parent_category_id: getCategoryId("Indian & Festive Wear", getId("Men")) },
    { name: "Dhotis", parent_category_id: getCategoryId("Indian & Festive Wear", getId("Men")) },
  ];

  // Women's subcategories based on the new image
  const womenSubCats = [
    // Indian & Fusion Wear
    { name: "Kurtas & Suits", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Kurtis, Tunics & Tops", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Sarees", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Ethnic Wear", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Leggings, Salwars & Churidars", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Skirts & Palazzos", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Dress Materials", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Lehenga Cholis", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Dupattas & Shawls", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },
    { name: "Women's Ethnic Jackets", parent_category_id: getCategoryId("Indian & Fusion Wear", getId("Women")) },

    // Western Wear
    { name: "Women's Dresses", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Women's Tops", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Women's Tshirts", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Women's Jeans", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Trousers & Capris", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Shorts & Skirts", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Co-ords", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Playsuits", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Jumpsuits", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Shrugs", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Sweaters & Sweatshirts", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Women's Jackets & Coats", parent_category_id: getCategoryId("Western Wear", getId("Women")) },
    { name: "Blazers & Waistcoats", parent_category_id: getCategoryId("Western Wear", getId("Women")) },

    // Lingerie & Sleepwear
    { name: "Bra", parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId("Women")) },
    { name: "Briefs", parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId("Women")) },
    { name: "Shapewear", parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId("Women")) },
    { name: "Women's Sleepwear", parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId("Women")) },
    { name: "Swimwear", parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId("Women")) },
    { name: "Camisoles & Women's Thermals", parent_category_id: getCategoryId("Women's Lingerie & Sleepwear", getId("Women")) },

    // Sports & Active Wear
    { name: "Sports Clothing", parent_category_id: getCategoryId("Sports & Active Wear", getId("Women")) },
    { name: "Sports Footwear", parent_category_id: getCategoryId("Sports & Active Wear", getId("Women")) },
    { name: "Sports Accessories", parent_category_id: getCategoryId("Sports & Active Wear", getId("Women")) },
    { name: "Sports Equipment", parent_category_id: getCategoryId("Sports & Active Wear", getId("Women")) },
  ];

  // Kids subcategories based on the new image
  const kidsSubCats = [
    // Boys Clothing
    { name: "Boys T-Shirts", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Shirts", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Shorts", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Jeans", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Trousers", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Clothing Sets", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Ethnic Wear", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Track Pants & Pyjamas", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Jacket & Sweaters", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Party Wear", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Innerwear", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Nightwear", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },
    { name: "Boys Value Packs", parent_category_id: getCategoryId("Boys Clothing", getId("Kids")) },

    // Girls Clothing
    { name: "Girls Dresses", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Tops", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Tshirts", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Clothing Sets", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Lehenga choli", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Kurta Sets", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Party wear", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Dungarees & Jumpsuits", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Skirts & shorts", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Tights & Leggings", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Jeans & Trousers", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Jacket & Sweaters", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Innerwear", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Nightwear", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },
    { name: "Girls Value Packs", parent_category_id: getCategoryId("Girls Clothing", getId("Kids")) },

    // Infants
    { name: "Infant Bodysuits", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Rompers & Sleepsuits", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Clothing Sets", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Tshirts & Tops", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Dresses", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Bottom wear", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Winter Wear", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Sleepwear", parent_category_id: getCategoryId("Infants", getId("Kids")) },
    { name: "Infant Care", parent_category_id: getCategoryId("Infants", getId("Kids")) },
  ];

  // Create men's, women's, and kids subcategories
  await createProductCategoriesWorkflow(container).run({
    input: {
      product_categories: [...menSubCats, ...womenSubCats, ...kidsSubCats]
    }
  });

  return [...createdMainCategories];
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
      ]
    }
  })

  return result
}

export async function createSeller(container: MedusaContainer) {
  const sellers = [

    {
      name: 'Oddy',
      email: 'oddy@gmail.com',
      password: 'admin',
      type: 'Manufacturer',
    },
    {
      name: 'Karnika',
      email: 'karnika@gmail.com',
      password: 'admin',
      type: 'Manufacturer',
    }

  ]

  const authService = container.resolve(Modules.AUTH)

  const sellerList = [] as any;
  for (const seller of sellers) {
    const { authIdentity } = await authService.register('emailpass', {
      body: {
        email: seller.email,
        password: seller.password
      }
    })

    const { result: sellerResult } = await createSellerWorkflow.run({
      container,
      input: {
        auth_identity_id: authIdentity?.id,
        member: {
          name: seller.name,
          email: seller.email
        }
      }
    })
    sellerList.push({
      ...seller,
      id: sellerResult.id
    })
  }

  return sellerList
}

export async function createSellerStockLocation(
  container: MedusaContainer,
  seller: any,
  salesChannelId: string
) {
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const {
    result: [stock]
  } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [
        {
          name: `${seller.name} Warehouse`,
          address: {
            address_1: seller.name == 'Oddy' ? 'Gandhi Nagar' : 'Kolkata',
            city: seller.name == 'Oddy' ? 'Delhi' : 'Kolkata',
            country_code: 'in'
          }
        }
      ]
    }
  })

  await link.create([
    {
      [SELLER_MODULE]: {
        seller_id: seller.id
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
        name: `${seller.name} fulfillment set`,
        type: 'shipping'
      },
      location_id: stock.id,
      seller_id: seller.id
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
  seller: any,
  fulfillmentSetId: string
) {
  await createServiceZonesWorkflow.run({
    container,
    input: {
      data: [
        {
          fulfillment_set_id: fulfillmentSetId,
          name: `India-${seller.name}`,
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
      seller_id: seller.id
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
          description: 'India shipping'
        },
        rules: [
          { value: 'true', attribute: 'enabled_in_store', operator: 'eq' },
          { attribute: 'is_return', value: 'false', operator: 'eq' }
        ],
        prices: [
          { currency_code: 'inr', amount: 100 },
          { amount: 100, region_id: regionId }
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
  const configurationService = container.resolve<ConfigurationModuleService>(
    CONFIGURATION_MODULE
  )

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
