import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  toHandle,
} from "@medusajs/framework/utils";
import { ProductStatus, type CreateOfferDTO } from "@mercurjs/types";
import {
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerShippingProfilesWorkflow,
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
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

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
    // create the default sales channel
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

  // Check if any of the countries are already assigned to a region
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
    // All countries already assigned - find the region that has most of our countries
    region = existingRegions.find(r =>
      r.countries?.some(c => countries.includes(c.iso_2))
    ) || existingRegions[0];
    logger.info("Countries already assigned to a region, skipping region creation.");
  } else if (unassignedCountries.length < countries.length) {
    // Some countries assigned, some not - only create with unassigned ones
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
    // No countries assigned - create full region
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

  // Link sales channel to API key (idempotent)
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
  type SeededCategory = { id: string; name: string };
  const catByName = new Map<string, SeededCategory>(
    existingCats.map((c) => [c.name, { id: c.id, name: c.name }])
  );

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
    result.forEach((c: SeededCategory) => catByName.set(c.name, c));
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
    result.forEach((c: SeededCategory) => catByName.set(c.name, c));
  }
  logger.info("Finished seeding product categories.");

  const SELLER_PASSWORD = "supersecret";
  const SELLER_CONFIGS = [
    { name: "Sole Society", email: "seller@mercur.dev", first_name: "Demo", last_name: "Seller", city: "Berlin", country_code: "DE", address_1: "Alexanderplatz 1" },
    { name: "Kickz Corner", email: "kickz@mercur.dev", first_name: "Kai", last_name: "Corner", city: "Amsterdam", country_code: "NL", address_1: "Damrak 12" },
    { name: "Trailhead Outfitters", email: "trailhead@mercur.dev", first_name: "Tara", last_name: "Head", city: "Munich", country_code: "DE", address_1: "Marienplatz 3" },
  ];
  const PRIMARY_SELLER_EMAIL = SELLER_CONFIGS[0].email;

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
          description: `${sellerConfig.name} — a demo marketplace seller.`,
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

    const { result: shippingProfiles } =
      await createSellerShippingProfilesWorkflow(container).run({
        input: {
          seller_id: seller.id,
          shipping_profiles: [
            { name: `${sellerConfig.name} Shipping`, type: "default" },
          ],
        },
      });
    const shippingProfileId = shippingProfiles[0].id;

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

  // Trademark-safe demo catalog. Images are generic AI-generated renders hosted
  // from /static via the jsDelivr GitHub CDN.
  const FOOTWEAR_SIZES = ["41", "42", "43"];

  type SeedProduct = {
    title: string;
    category: string;
    price: number;
    description: string;
    image: string;
  };
  const SEED_PRODUCTS: SeedProduct[] = [
    { title: "Cityline Canvas High Top", category: "Sneakers", price: 82, description: "Cityline Canvas High Top in Black Denim.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cityline-canvas-high-top-1.png" },
    { title: "Vantage 204 Runner", category: "Sneakers", price: 95, description: "Vantage 204 Runner in Beige Brown.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/vantage-204-runner-1.png" },
    { title: "Halcyon Sherpa Runner", category: "Sneakers", price: 279, description: "Halcyon Sherpa Runner in Cream.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/halcyon-sherpa-runner-1.png" },
    { title: "Strive Pro Mid-Cut Firm Ground Cleats", category: "Boots", price: 250, description: "Strive Pro Mid-Cut Firm Ground Cleats in Aurora Blue Solar Yellow.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-pro-mid-cut-firm-ground-cleats-1.png" },
    { title: "Cloudpeak Classic Mini Boot", category: "Boots", price: 155, description: "Cloudpeak Classic Mini Boot in Black.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-classic-mini-boot-1.png" },
    { title: "Cloudpeak Ultra Mini Boot", category: "Boots", price: 160, description: "Cloudpeak Ultra Mini Boot in Hickory.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/cloudpeak-ultra-mini-boot-1.png" },
    { title: "Meridian Twin-Strap Buckle Sandal", category: "Sandals", price: 155, description: "Meridian Twin-Strap Buckle Sandal in Black - Regular/Wide.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-twin-strap-buckle-sandal-1.png" },
    { title: "Meridian Twin-Strap Sandal", category: "Sandals", price: 125, description: "Meridian Twin-Strap Sandal in Pearl White - Narrow.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-twin-strap-sandal-1.png" },
    { title: "Meridian Clog Slide", category: "Sandals", price: 232, description: "Meridian Clog Slide in Anthracite.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/meridian-clog-slide-1.png" },
    { title: "Strive Pro FG Cleats", category: "Sport", price: 131, description: "Strive Pro FG Cleats in Aurora Black Platinum.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-pro-fg-cleats-1.png" },
    { title: "Strive Talon Pro FG Cleats", category: "Sport", price: 155, description: "Strive Talon Pro FG Cleats in Midnight Navy.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-talon-pro-fg-cleats-1.png" },
    { title: "Strive Taekwondo Trainers", category: "Sport", price: 119, description: "Strive Taekwondo Trainers in Silver Lilac.", image: "https://cdn.jsdelivr.net/gh/mercurjs/mercur@main/static/strive-taekwondo-trainers-1.png" },
  ];

  // Round-robin each product into one of its department's sub-categories.
  const childCursor: Record<string, number> = {};
  const nextChildId = (parent: string) => {
    const children = CATEGORY_TREE[parent];
    const i = (childCursor[parent] ?? 0) % children.length;
    childCursor[parent] = i + 1;
    return catByName.get(children[i])!.id;
  };

  const priceByHandle = new Map<string, number>();
  const products = SEED_PRODUCTS.map((item) => {
    const handle = toHandle(item.title);
    const skuBase = handle.toUpperCase().replace(/-/g, "");
    priceByHandle.set(handle, item.price);
    return {
      title: item.title,
      category_ids: [nextChildId(item.category)],
      description: item.description,
      handle,
      weight: 1200,
      status: ProductStatus.PUBLISHED,
      thumbnail: item.image,
      images: [{ url: item.image }],
      attributes: [
        { title: "Size", values: FOOTWEAR_SIZES, is_variant_axis: true },
      ],
      variants: FOOTWEAR_SIZES.map((size) => ({
        title: `EU ${size}`,
        sku: `${skuBase}-EU${size}`,
        options: { Size: size },
      })),
    };
  });

  await createProductsWorkflow(container).run({
    input: { created_by: primarySeller.memberId, products },
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

  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id", "variants.sku"],
    filters: {
      handle: products.map((product) => product.handle),
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
        const jitter = 1 + (rand() * 0.3 - 0.15); // ±15%
        const eur = Math.max(1, Math.round(basePrice * jitter));
        const usd = Math.round(eur * 1.08);
        const sku = `OFFER-${seller.id.slice(-4)}-${variant.sku}`;
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

  await createOffersWorkflow(container).run({ input: { offers } });
  logger.info(
    `Finished creating ${offers.length} offers across ${sellers.length} sellers.`
  );

  logger.info("Finished seeding.");
}
