import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  toHandle,
} from "@medusajs/framework/utils";
import {
  AttributeType,
  ProductStatus,
  type CreateOfferDTO,
  type CreateProductDTO,
} from "@mercurjs/types";
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductAttributesWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
} from "@mercurjs/core/workflows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createLocationFulfillmentSetWorkflow,
  createProductCategoriesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createServiceZonesWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

// Demo catalog with fictional brands and generic product names. Titles, brands,
// and colorways are invented for a trademark-safe marketplace demo — they do not
// reference any real brand or protected product design. Product images are generic
// AI-generated renders hosted from /static via the jsDelivr GitHub CDN (main branch).
type SeedCatalogItem = {
  title: string;
  brand: string;
  colorway: string;
  category: "Sandals" | "Sneakers" | "Boots" | "Sport" | "Accessories";
  price: number;
  footwear: boolean;
  description: string;
  images: string[];
};

const seedCatalog: SeedCatalogItem[] = [
  {
    title: "Meridian Twin-Strap Buckle Sandal",
    brand: "Meridian",
    colorway: "Black - Regular/Wide",
    price: 155,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-twin-strap-buckle-sandal-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Meridian Twin-Strap Buckle Sandal in Black - Regular/Wide.",
  },
  {
    title: "Meridian Twin-Strap Sandal",
    brand: "Meridian",
    colorway: "Pearl White - Narrow",
    price: 125,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-twin-strap-sandal-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Meridian Twin-Strap Sandal in Pearl White - Narrow.",
  },
  {
    title: "Meridian Clog Slide",
    brand: "Meridian",
    colorway: "Anthracite",
    price: 232,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-clog-slide-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Meridian Clog Slide in Anthracite.",
  },
  {
    title: "Cloudpeak Golden Slide",
    brand: "Cloudpeak",
    colorway: "Dark Sand",
    price: 72,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-golden-slide-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Cloudpeak Golden Slide in Dark Sand.",
  },
  {
    title: "Meridian Wire Buckle Clog",
    brand: "Meridian",
    colorway: "Vintage Wood Roast",
    price: 226,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-wire-buckle-clog-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Meridian Wire Buckle Clog in Vintage Wood Roast.",
  },
  {
    title: "Cloudpeak Golden Sandal",
    brand: "Cloudpeak",
    colorway: "Bay Fog",
    price: 78,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-golden-sandal-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Cloudpeak Golden Sandal in Bay Fog.",
  },
  {
    title: "Apex Pool Slides",
    brand: "Apex",
    colorway: "Black",
    price: 47,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-pool-slides-1.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-pool-slides-2.png",
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/apex-pool-slides-3.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Apex Pool Slides in Black.",
  },
  {
    title: "Strive Mule Slides",
    brand: "Strive",
    colorway: "Core Black Gum",
    price: 106,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-mule-slides-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Strive Mule Slides in Core Black Gum.",
  },
  {
    title: "Nimbus Classic Clog",
    brand: "Nimbus",
    colorway: "Pond",
    price: 60,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/nimbus-classic-clog-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Nimbus Classic Clog in Pond.",
  },
  {
    title: "Cloudpeak Starlet Sandal",
    brand: "Cloudpeak",
    colorway: "Sand",
    price: 83,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-starlet-sandal-1.png",
    ],
    category: "Sandals",
    footwear: true,
    description: "Cloudpeak Starlet Sandal in Sand.",
  },
  {
    title: "Cityline Canvas High Top",
    brand: "Cityline",
    colorway: "Black Denim",
    price: 82,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cityline-canvas-high-top-1.png",
    ],
    category: "Sneakers",
    footwear: true,
    description: "Cityline Canvas High Top in Black Denim.",
  },
  {
    title: "Vantage 204 Runner",
    brand: "Vantage",
    colorway: "Beige Brown",
    price: 95,
    images: [
      "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/vantage-204-runner-1.png",
    ],
    category: "Sneakers",
    footwear: true,
    description: "Vantage 204 Runner in Beige Brown.",
  },
];

const updateStoreCurrencies = createWorkflow(
  "update-store-currencies",
  (input: {
    supported_currencies: { currency_code: string; is_default?: boolean }[];
    store_id: string;
  }) => {
    const normalizedInput = transform({ input }, (data) => {
      return {
        selector: { id: data.input.store_id },
        update: {
          supported_currencies: data.input.supported_currencies.map(
            (currency) => {
              return {
                currency_code: currency.currency_code,
                is_default: currency.is_default ?? false,
              };
            }
          ),
        },
      };
    });

    const stores = updateStoresStep(normalizedInput);

    return new WorkflowResponse(stores);
  }
);

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  logger.info("Seeding store data...");
  const [store] = await storeModuleService.listStores();
  let defaultSalesChannel = await salesChannelModuleService.listSalesChannels({
    name: "Default Sales Channel",
  });

  if (!defaultSalesChannel.length) {
    const { result: salesChannelResult } = await createSalesChannelsWorkflow(
      container
    ).run({
      input: {
        salesChannelsData: [
          {
            name: "Default Sales Channel",
          },
        ],
      },
    });
    defaultSalesChannel = salesChannelResult;
  }

  await updateStoreCurrencies(container).run({
    input: {
      store_id: store.id,
      supported_currencies: [
        {
          currency_code: "eur",
          is_default: true,
        },
        {
          currency_code: "usd",
        },
      ],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: 'Mercur Marketplace',
        default_sales_channel_id: defaultSalesChannel[0].id,
      },
    },
  });
  logger.info("Seeding region data...");
  const regionModuleService = container.resolve(Modules.REGION);

  const existingRegions = await regionModuleService.listRegions({}, {
    relations: ["countries"],
  });

  const assignedCountries = new Set<string>();
  for (const r of existingRegions) {
    for (const c of r.countries || []) {
      assignedCountries.add(c.iso_2);
    }
  }

  const unassignedCountries = countries.filter(c => !assignedCountries.has(c));

  let region;
  if (unassignedCountries.length === 0) {
    region = existingRegions.find(r =>
      r.countries?.some(c => countries.includes(c.iso_2))
    ) || existingRegions[0];
    logger.info("Countries already assigned to a region, skipping region creation.");
  } else if (unassignedCountries.length < countries.length) {
    logger.info(`Some countries already assigned, creating region with: ${unassignedCountries.join(", ")}`);
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Europe",
            currency_code: "eur",
            countries: unassignedCountries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
  } else {
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Europe",
            currency_code: "eur",
            countries,
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
    region = regionResult[0];
  }
  logger.info("Finished seeding regions.");

  logger.info("Seeding tax regions...");
  const taxModuleService = container.resolve(Modules.TAX);
  const existingTaxRegions = await taxModuleService.listTaxRegions();
  const existingCountryCodes = new Set(existingTaxRegions.map((tr) => tr.country_code));
  const countriesToCreate = countries.filter((c) => !existingCountryCodes.has(c));

  if (countriesToCreate.length > 0) {
    await createTaxRegionsWorkflow(container).run({
      input: countriesToCreate.map((country_code) => ({
        country_code,
        provider_id: "tp_system",
      })),
    });
  } else {
    logger.info("Tax regions already exist, skipping.");
  }
  logger.info("Finished seeding tax regions.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey;
  const { data } = await query.graph({
    entity: "api_key",
    fields: ["id"],
    filters: {
      type: "publishable",
    },
  });

  publishableApiKey = data?.[0];

  if (!publishableApiKey) {
    const {
      result: [publishableApiKeyResult],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "Webshop",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    });

    publishableApiKey = publishableApiKeyResult
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel[0].id],
      },
    });
  } catch (error: unknown) {
    // Ignore if link already exists
    if (!(error instanceof Error && error.message.includes("already"))) {
      throw error;
    }
    logger.info("Sales channel already linked to API key, skipping.");
  }
  logger.info("Finished seeding publishable API key data.");

  logger.info("Seeding product categories...");
  const productModule = container.resolve(Modules.PRODUCT);

  // Departments (roots) and their sub-categories; array order sets nav `rank`.
  const CATEGORY_TREE: Record<string, string[]> = {
    Sandals: ["Slides", "Flip Flops", "Clogs"],
    Sneakers: ["Low Top", "High Top", "Retro"],
    Boots: ["Chelsea Boots", "Winter Boots", "Work Boots"],
    Sport: ["Football", "Running", "Basketball"],
    Accessories: ["Bags", "Headwear", "Wallets"],
  };
  const parentNames = Object.keys(CATEGORY_TREE);
  const childNames = Object.values(CATEGORY_TREE).flat();

  const existingCats = await productModule.listProductCategories({
    name: [...parentNames, ...childNames],
  });
  const catByName = new Map(existingCats.map((c) => [c.name, c]));

  const missingParents = parentNames.filter((name) => !catByName.has(name));
  if (missingParents.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingParents.map((name) => ({
          name,
          is_active: true,
          rank: parentNames.indexOf(name),
        })),
      },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }

  const childInputs: {
    name: string;
    is_active: boolean;
    rank: number;
    parent_category_id: string;
  }[] = [];
  for (const parent of parentNames) {
    CATEGORY_TREE[parent].forEach((childName, rank) => {
      if (!catByName.has(childName)) {
        childInputs.push({
          name: childName,
          is_active: true,
          rank,
          parent_category_id: catByName.get(parent)!.id,
        });
      }
    });
  }
  if (childInputs.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: childInputs },
    });
    result.forEach((c) => catByName.set(c.name, c));
  }
  logger.info("Finished seeding product categories.");

  // Global product attributes (Mercur product-attribute module). Each is a
  // multi_select variant axis so it maps to a native Medusa product option and
  // powers `/store/products` filtering via `variants.options`. Products restrict
  // Color/Condition to a single value each, so variant count stays size-driven.
  logger.info("Seeding global product attributes...");

  const FOOTWEAR_SIZES = ["40", "41", "42", "43", "44", "45"];
  const COLOR_VALUES = [
    "Black",
    "White",
    "Grey",
    "Brown",
    "Beige",
    "Green",
    "Blue",
    "Red",
    "Yellow",
    "Orange",
    "Purple",
    "Pink",
    "Multicolor",
  ];
  const CONDITION_VALUES = ["New", "Like New", "Used"];

  const ATTRIBUTE_DEFS = [
    { name: "Size", handle: "size", values: FOOTWEAR_SIZES },
    { name: "Color", handle: "color", values: COLOR_VALUES },
    { name: "Condition", handle: "condition", values: CONDITION_VALUES },
  ];

  type SeededAttribute = {
    id: string;
    handle: string;
    values: { id: string; name: string }[];
  };

  const loadAttributes = async () => {
    const { data } = await query.graph({
      entity: "product_attribute",
      fields: ["id", "handle", "values.id", "values.name"],
      filters: {
        handle: ATTRIBUTE_DEFS.map((a) => a.handle),
        product_id: null,
      },
    });
    return new Map(
      (data as SeededAttribute[]).map((a) => [a.handle, a])
    );
  };

  let attrByHandle = await loadAttributes();
  const missingAttrs = ATTRIBUTE_DEFS.filter((a) => !attrByHandle.has(a.handle));

  if (missingAttrs.length) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: missingAttrs.map((attr, index) => ({
          name: attr.name,
          handle: attr.handle,
          type: AttributeType.MULTI_SELECT,
          is_variant_axis: true,
          is_filterable: true,
          rank: index,
          values: attr.values.map((name, rank) => ({ name, rank })),
        })),
      },
    });
    attrByHandle = await loadAttributes();
  }

  const sizeAttr = attrByHandle.get("size")!;
  const colorAttr = attrByHandle.get("color")!;
  const conditionAttr = attrByHandle.get("condition")!;

  const valueId = (attr: SeededAttribute, name: string) =>
    attr.values.find((v) => v.name === name)?.id;

  const COLOR_KEYWORDS: [string, string][] = [
    ["black", "Black"],
    ["white", "White"],
    ["pearl", "White"],
    ["cream", "Beige"],
    ["sand", "Beige"],
    ["beige", "Beige"],
    ["wheat", "Beige"],
    ["tan", "Beige"],
    ["nubuck", "Beige"],
    ["grey", "Grey"],
    ["gray", "Grey"],
    ["anthracite", "Grey"],
    ["quarry", "Grey"],
    ["graphite", "Grey"],
    ["platinum", "Grey"],
    ["brown", "Brown"],
    ["chocolate", "Brown"],
    ["cocoa", "Brown"],
    ["wood", "Brown"],
    ["hickory", "Brown"],
    ["chestnut", "Brown"],
    ["roast", "Brown"],
    ["truffle", "Brown"],
    ["olive", "Green"],
    ["camo", "Green"],
    ["neon", "Green"],
    ["green", "Green"],
    ["sapphire", "Blue"],
    ["cobalt", "Blue"],
    ["turquoise", "Blue"],
    ["aurora", "Blue"],
    ["blue", "Blue"],
    ["maroon", "Red"],
    ["red", "Red"],
    ["yellow", "Yellow"],
    ["orange", "Orange"],
    ["purple", "Purple"],
    ["pink", "Pink"],
    ["multi", "Multicolor"],
  ];
  const mapColor = (colorway: string) => {
    const c = colorway.toLowerCase();
    for (const [keyword, color] of COLOR_KEYWORDS) {
      if (c.includes(keyword)) {
        return color;
      }
    }
    return "Multicolor";
  };
  const conditionForIndex = (index: number) =>
    ["New", "New", "New", "Like New", "Used"][index % 5];

  logger.info("Finished seeding global product attributes.");

  const SELLER_PASSWORD = "supersecret";
  const SELLER_CONFIGS = [
    { name: "Sole Society", email: "seller@mercur.dev", first_name: "Demo", last_name: "Seller", city: "Berlin", country_code: "DE", address_1: "Alexanderplatz 1" },
    { name: "Kickz Corner", email: "kickz@mercur.dev", first_name: "Kai", last_name: "Corner", city: "Amsterdam", country_code: "NL", address_1: "Damrak 12" },
    { name: "Trailhead Outfitters", email: "trailhead@mercur.dev", first_name: "Tara", last_name: "Head", city: "Munich", country_code: "DE", address_1: "Marienplatz 3" },
  ];
  const PRIMARY_SELLER_EMAIL = SELLER_CONFIGS[0].email;

  // DiceBear renders a crisp initials avatar per seller name; Picsum returns a
  // deterministic photo for the same seed, so re-seeding is stable.
  const sellerLogo = (name: string) =>
    `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`;
  const sellerBanner = (name: string) =>
    `https://picsum.photos/seed/${toHandle(name)}/1200/320`;

  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: PRIMARY_SELLER_EMAIL },
  });

  if (existingSellers[0]) {
    logger.info(
      "Demo sellers already exist, skipping seller, product and offer seeding."
    );
    logger.info("Finished seeding.");
    return;
  }

  const authModuleService = container.resolve(Modules.AUTH);

  // One marketplace-wide shipping profile shared by every seller's shipping
  // options and every offer. createOffersWorkflow links each offer's product to
  // this profile, so the cart-refresh orphan-cleanup keeps per-seller shipping
  // methods (it matches option profile against the product's profile).
  let sharedShippingProfileId: string;
  const { data: existingProfiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
    filters: { name: "Marketplace Shipping" },
  });
  if (existingProfiles[0]) {
    sharedShippingProfileId = existingProfiles[0].id as string;
  } else {
    const {
      result: [createdProfile],
    } = await createShippingProfilesWorkflow(container).run({
      input: { data: [{ name: "Marketplace Shipping", type: "default" }] },
    });
    sharedShippingProfileId = createdProfile.id;
  }

  type SeededSeller = {
    id: string;
    name: string;
    memberId: string;
    stockLocationId: string;
    shippingProfileId: string;
  };
  const sellers: SeededSeller[] = [];

  for (const [index, sellerConfig] of SELLER_CONFIGS.entries()) {
    logger.info(`Seeding seller "${sellerConfig.name}"...`);

    let authIdentityId: string;
    const registerResponse = await authModuleService.register("emailpass", {
      body: { email: sellerConfig.email, password: SELLER_PASSWORD },
    });

    if (registerResponse.success && registerResponse.authIdentity) {
      authIdentityId = registerResponse.authIdentity.id;
    } else {
      const [providerIdentity] =
        await authModuleService.listProviderIdentities({
          entity_id: sellerConfig.email,
          provider: "emailpass",
        });
      authIdentityId = providerIdentity.auth_identity_id!;
    }

    const { result: seller } = await createSellerAccountWorkflow(
      container
    ).run({
      input: {
        auth_identity_id: authIdentityId,
        member_email: sellerConfig.email,
        first_name: sellerConfig.first_name,
        last_name: sellerConfig.last_name,
        seller: {
          name: sellerConfig.name,
          email: sellerConfig.email,
          currency_code: "eur",
          description: `${sellerConfig.name} — a demo marketplace footwear seller.`,
          logo: sellerLogo(sellerConfig.name),
          banner: sellerBanner(sellerConfig.name),
        },
      },
    });

    await approveSellerWorkflow(container).run({
      input: { seller_id: seller.id },
    });

  const { data: members } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email: sellerConfig.email },
    });
    const memberId = members[0].id;

    const { result: stockLocations } =
      await createSellerStockLocationsWorkflow(container).run({
        input: {
          seller_id: seller.id,
          locations: [
            {
              name: `${sellerConfig.name} Warehouse`,
              address: {
                city: sellerConfig.city,
                country_code: sellerConfig.country_code,
                address_1: sellerConfig.address_1,
              },
            },
          ],
        },
      });
    const stockLocation = stockLocations[0];

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: stockLocation.id,
        add: [defaultSalesChannel[0].id],
      },
    });

    if (index === 0) {
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: {
            default_location_id: stockLocation.id,
          },
        },
      });
    }

    await createLocationFulfillmentSetWorkflow(container).run({
      input: {
        location_id: stockLocation.id,
        fulfillment_set_data: {
          name: `${sellerConfig.name} delivery`,
          type: "shipping",
        },
      },
    });

    const {
      data: [locationWithSet],
    } = await query.graph({
      entity: "stock_location",
      fields: ["id", "fulfillment_sets.id"],
      filters: { id: stockLocation.id },
    });
    const fulfillmentSetId = locationWithSet?.fulfillment_sets?.[0]?.id;
    if (!fulfillmentSetId) {
      throw new Error(
        `Fulfillment set was not created for seller "${sellerConfig.name}"`
      );
    }

    const { result: serviceZones } = await createServiceZonesWorkflow(
      container
    ).run({
      input: {
        data: [
          {
            fulfillment_set_id: fulfillmentSetId,
            name: `${sellerConfig.name} Europe`,
            geo_zones: countries.map((country_code) => ({
              country_code,
              type: "country" as const,
            })),
          },
        ],
      },
    });
    const serviceZoneId = serviceZones[0].id;

    const shippingProfileId = sharedShippingProfileId;

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          {
            name: "Standard Shipping",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: "Standard",
              description: "Ship in 2-3 days.",
              code: "standard",
            },
            prices: [
              { currency_code: "usd", amount: 10 },
              { currency_code: "eur", amount: 10 },
              { region_id: region.id, amount: 10 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
          {
            name: "Express Shipping",
            price_type: "flat",
            provider_id: "manual_manual",
            service_zone_id: serviceZoneId,
            shipping_profile_id: shippingProfileId,
            type: {
              label: "Express",
              description: "Ship in 24 hours.",
              code: "express",
            },
            prices: [
              { currency_code: "usd", amount: 10 },
              { currency_code: "eur", amount: 10 },
              { region_id: region.id, amount: 10 },
            ],
            rules: [
              { attribute: "enabled_in_store", value: "true", operator: "eq" },
              { attribute: "is_return", value: "false", operator: "eq" },
            ],
          },
        ],
      },
    });

    sellers.push({
      id: seller.id,
      name: sellerConfig.name,
      memberId,
      stockLocationId: stockLocation.id,
      shippingProfileId,
    });
    logger.info(`Finished seeding seller "${sellerConfig.name}".`);
  }

  const primarySeller = sellers[0];
  logger.info(`Finished seeding ${sellers.length} sellers.`);

  logger.info("Seeding product data...");

  const catalog = seedCatalog;

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/'/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const usedHandles = new Set<string>();
  const uniqueHandle = (title: string) => {
    const base = slugify(title);
    let handle = base;
    let n = 2;
    while (usedHandles.has(handle)) {
      handle = `${base}-${n++}`;
    }
    usedHandles.add(handle);
    return handle;
  };

  const childCursor: Record<string, number> = {};
  const nextChildId = (parent: string) => {
    const children = CATEGORY_TREE[parent];
    const i = (childCursor[parent] ?? 0) % children.length;
    childCursor[parent] = i + 1;
    return catByName.get(children[i])!.id;
  };

  const products: CreateProductDTO[] = catalog.map((item, index) => {
    const handle = uniqueHandle(item.title);
    const skuBase = handle.toUpperCase().replace(/-/g, "");
    const images = item.images.map((url) => ({ url }));

    const color = mapColor(item.colorway);
    const condition = conditionForIndex(index);

    const attributes = [
      ...(item.footwear
        ? [
            {
              id: sizeAttr.id,
              value_ids: FOOTWEAR_SIZES.map((size) =>
                valueId(sizeAttr, size)
              ).filter((id): id is string => Boolean(id)),
            },
          ]
        : []),
      {
        id: colorAttr.id,
        value_ids: [valueId(colorAttr, color)].filter(
          (id): id is string => Boolean(id)
        ),
      },
      {
        id: conditionAttr.id,
        value_ids: [valueId(conditionAttr, condition)].filter(
          (id): id is string => Boolean(id)
        ),
      },
    ];

    const variants = item.footwear
      ? FOOTWEAR_SIZES.map((size) => ({
          title: `EU ${size}`,
          sku: `${skuBase}-EU${size}`,
          options: { Size: size, Color: color, Condition: condition },
        }))
      : [
          {
            title: "One Size",
            sku: `${skuBase}-OS`,
            options: { Color: color, Condition: condition },
          },
        ];

    return {
      title: item.title,
      category_ids: [nextChildId(item.category)],
      description: item.description,
      handle,
      weight: item.footwear ? 1200 : 400,
      status: ProductStatus.PUBLISHED,
      thumbnail: images[0].url,
      images,
      attributes,
      variants,
    };
  });

  await createProductsWorkflow(container).run({
    input: {
      created_by: primarySeller.memberId,
      products,
    },
  });
  logger.info(`Finished seeding ${products.length} products.`);

  logger.info("Creating randomized offers across sellers...");

  // Deterministic PRNG (mulberry32) so re-seeding produces the same spread.
  let rngState = 0x9e3779b9;
  const rand = () => {
    rngState = (rngState + 0x6d2b79f5) | 0;
    let t = rngState;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const randInt = (min: number, max: number) =>
    min + Math.floor(rand() * (max - min + 1));

  const priceByHandle = new Map(
    products.map((product, index) => [product.handle, catalog[index].price])
  );
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: {
      handle: products
        .map((product) => product.handle)
        .filter((handle): handle is string => Boolean(handle)),
    },
  });

  const offers: CreateOfferDTO[] = [];

  for (const product of seededProducts) {
    const basePrice = priceByHandle.get(product.handle) ?? 50;

    // At least one seller always carries the product; the rest are random.
    const shuffledSellers = [...sellers].sort(() => rand() - 0.5);
    const participantCount = randInt(1, sellers.length);
    const participants = shuffledSellers.slice(0, participantCount);

    for (const seller of participants) {
      for (const variant of product.variants as {
        id: string;
        sku: string | null;
      }[]) {
        const offerCount = randInt(1, 2);
        for (let o = 0; o < offerCount; o++) {
          const jitter = 1 + (rand() * 0.3 - 0.15); // ±15%
          const eur = Math.max(1, Math.round(basePrice * jitter));
          const usd = Math.round(eur * 1.08);
          const sku = `OFFER-${seller.id.slice(-4)}-${variant.sku}-${o + 1}`;
          offers.push({
            seller_id: seller.id,
            created_by: seller.memberId,
            sku,
            variant_id: variant.id,
            shipping_profile_id: seller.shippingProfileId,
            inventory_items: [
              {
                sku,
                stock_levels: [
                  {
                    location_id: seller.stockLocationId,
                    stocked_quantity: 1000000,
                  },
                ],
              },
            ],
            prices: [
              { amount: eur, currency_code: "eur" },
              { amount: usd, currency_code: "usd" },
            ],
          });
        }
      }
    }
  }

  await createOffersWorkflow(container).run({ input: { offers } });
  logger.info(
    `Finished creating ${offers.length} offers across ${sellers.length} sellers.`
  );

  logger.info("Finished seeding.");
}
