import { ExecArgs } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { ProductStatus } from "@mercurjs/types";
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
  const categoryNames = ["Shirts", "Sweatshirts", "Pants", "Merch"];
  const existingCategories = await productModule.listProductCategories({
    name: categoryNames,
  });

  let categoryResult;
  if (existingCategories.length === categoryNames.length) {
    categoryResult = existingCategories;
    logger.info("Product categories already exist, skipping.");
  } else {
    const categoriesToCreate = categoryNames.filter(
      (name) => !existingCategories.find((c) => c.name === name)
    );
    const { result: newCategories } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: categoriesToCreate.map((name) => ({
          name,
          is_active: true,
        })),
      },
    });
    categoryResult = [...existingCategories, ...newCategories];
  }
  logger.info("Finished seeding product categories.");

  const SELLER_EMAIL = "seller@mercur.dev";
  const SELLER_PASSWORD = "supersecret";

  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  });

  if (existingSellers[0]) {
    logger.info(
      "Demo seller already exists, skipping seller, product and offer seeding."
    );
    logger.info("Finished seeding.");
    return;
  }

  logger.info("Seeding demo seller...");
  const authModuleService = container.resolve(Modules.AUTH);

  let authIdentityId: string;
  const registerResponse = await authModuleService.register("emailpass", {
    body: { email: SELLER_EMAIL, password: SELLER_PASSWORD },
  });

  if (registerResponse.success && registerResponse.authIdentity) {
    authIdentityId = registerResponse.authIdentity.id;
  } else {
    const [providerIdentity] = await authModuleService.listProviderIdentities({
      entity_id: SELLER_EMAIL,
      provider: "emailpass",
    });
    authIdentityId = providerIdentity.auth_identity_id!;
  }

  const { result: demoSeller } = await createSellerAccountWorkflow(
    container
  ).run({
    input: {
      auth_identity_id: authIdentityId,
      member_email: SELLER_EMAIL,
      first_name: "Demo",
      last_name: "Seller",
      seller: {
        name: "Demo Store",
        email: SELLER_EMAIL,
        currency_code: "eur",
        description:
          "A demo marketplace seller with a full catalog of offers.",
      },
    },
  });

  await approveSellerWorkflow(container).run({
    input: { seller_id: demoSeller.id },
  });

  const { data: members } = await query.graph({
    entity: "member",
    fields: ["id"],
    filters: { email: SELLER_EMAIL },
  });
  const demoSellerMemberId = members[0].id;

  const { result: sellerStockLocations } =
    await createSellerStockLocationsWorkflow(container).run({
      input: {
        seller_id: demoSeller.id,
        locations: [
          {
            name: "Demo Store Warehouse",
            address: {
              city: "Berlin",
              country_code: "DE",
              address_1: "Alexanderplatz 1",
            },
          },
        ],
      },
    });
  const sellerStockLocation = sellerStockLocations[0];

  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: sellerStockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  });

  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: sellerStockLocation.id,
      add: [defaultSalesChannel[0].id],
    },
  });

  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_location_id: sellerStockLocation.id,
      },
    },
  });

  await createLocationFulfillmentSetWorkflow(container).run({
    input: {
      location_id: sellerStockLocation.id,
      fulfillment_set_data: {
        name: "Demo Store delivery",
        type: "shipping",
      },
    },
  });

  const {
    data: [locationWithSet],
  } = await query.graph({
    entity: "stock_location",
    fields: ["id", "fulfillment_sets.id"],
    filters: { id: sellerStockLocation.id },
  });
  const sellerFulfillmentSetId = locationWithSet?.fulfillment_sets?.[0]?.id;
  if (!sellerFulfillmentSetId) {
    throw new Error("Seller fulfillment set was not created");
  }

  const { result: sellerServiceZones } = await createServiceZonesWorkflow(
    container
  ).run({
    input: {
      data: [
        {
          fulfillment_set_id: sellerFulfillmentSetId,
          name: "Europe",
          geo_zones: countries.map((country_code) => ({
            country_code,
            type: "country" as const,
          })),
        },
      ],
    },
  });
  const sellerServiceZoneId = sellerServiceZones[0].id;

  const { result: sellerShippingProfiles } =
    await createSellerShippingProfilesWorkflow(container).run({
      input: {
        seller_id: demoSeller.id,
        shipping_profiles: [{ name: "Demo Store Shipping", type: "default" }],
      },
    });
  const sellerShippingProfileId = sellerShippingProfiles[0].id;

  await createSellerShippingOptionsWorkflow(container).run({
    input: {
      seller_id: demoSeller.id,
      shipping_options: [
        {
          name: "Standard Shipping",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: sellerServiceZoneId,
          shipping_profile_id: sellerShippingProfileId,
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
          service_zone_id: sellerServiceZoneId,
          shipping_profile_id: sellerShippingProfileId,
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
  logger.info("Finished seeding demo seller.");

  logger.info("Seeding product data...");

  await createProductsWorkflow(container).run({
    input: {
      created_by: demoSellerMemberId,
      products: [
        {
          title: "Basic T-Shirt",
          category_ids: [
            categoryResult.find((cat: { name: string }) => cat.name === "Shirts")!.id,
          ],
          description:
            "Reimagine the feeling of a classic T-shirt. With our cotton T-shirts, everyday essentials no longer have to be ordinary.",
          handle: "t-shirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          seller_ids: [demoSeller.id],
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-black-back.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/tee-white-back.png" },
          ],
          attributes: [
            { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
            { title: "Color", values: ["Black", "White"], is_variant_axis: true },
          ],
          variants: [
            { title: "S / Black", sku: "SHIRT-S-BLACK", options: { Size: "S", Color: "Black" } },
            { title: "S / White", sku: "SHIRT-S-WHITE", options: { Size: "S", Color: "White" } },
            { title: "M / Black", sku: "SHIRT-M-BLACK", options: { Size: "M", Color: "Black" } },
            { title: "M / White", sku: "SHIRT-M-WHITE", options: { Size: "M", Color: "White" } },
            { title: "L / Black", sku: "SHIRT-L-BLACK", options: { Size: "L", Color: "Black" } },
            { title: "L / White", sku: "SHIRT-L-WHITE", options: { Size: "L", Color: "White" } },
            { title: "XL / Black", sku: "SHIRT-XL-BLACK", options: { Size: "XL", Color: "Black" } },
            { title: "XL / White", sku: "SHIRT-XL-WHITE", options: { Size: "XL", Color: "White" } },
          ],
        },
        {
          title: "Basic Sweatshirt",
          category_ids: [
            categoryResult.find((cat: { name: string }) => cat.name === "Sweatshirts")!.id,
          ],
          description:
            "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
          handle: "sweatshirt",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          seller_ids: [demoSeller.id],
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-back.png" },
          ],
          attributes: [
            { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
          ],
          variants: [
            { title: "S", sku: "SWEATSHIRT-S", options: { Size: "S" } },
            { title: "M", sku: "SWEATSHIRT-M", options: { Size: "M" } },
            { title: "L", sku: "SWEATSHIRT-L", options: { Size: "L" } },
            { title: "XL", sku: "SWEATSHIRT-XL", options: { Size: "XL" } },
          ],
        },
        {
          title: "Basic Sweatpants",
          category_ids: [
            categoryResult.find((cat: { name: string }) => cat.name === "Pants")!.id,
          ],
          description:
            "Reimagine the feeling of classic sweatpants. With our cotton sweatpants, everyday essentials no longer have to be ordinary.",
          handle: "sweatpants",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          seller_ids: [demoSeller.id],
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatpants-gray-back.png" },
          ],
          attributes: [
            { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
          ],
          variants: [
            { title: "S", sku: "SWEATPANTS-S", options: { Size: "S" } },
            { title: "M", sku: "SWEATPANTS-M", options: { Size: "M" } },
            { title: "L", sku: "SWEATPANTS-L", options: { Size: "L" } },
            { title: "XL", sku: "SWEATPANTS-XL", options: { Size: "XL" } },
          ],
        },
        {
          title: "Basic Shorts",
          category_ids: [
            categoryResult.find((cat: { name: string }) => cat.name === "Merch")!.id,
          ],
          description:
            "Reimagine the feeling of classic shorts. With our cotton shorts, everyday essentials no longer have to be ordinary.",
          handle: "shorts",
          weight: 400,
          status: ProductStatus.PUBLISHED,
          seller_ids: [demoSeller.id],
          images: [
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-front.png" },
            { url: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/shorts-vintage-back.png" },
          ],
          attributes: [
            { title: "Size", values: ["S", "M", "L", "XL"], is_variant_axis: true },
          ],
          variants: [
            { title: "S", sku: "SHORTS-S", options: { Size: "S" } },
            { title: "M", sku: "SHORTS-M", options: { Size: "M" } },
            { title: "L", sku: "SHORTS-L", options: { Size: "L" } },
            { title: "XL", sku: "SHORTS-XL", options: { Size: "XL" } },
          ],
        },
      ],
    },
  });
  logger.info("Finished seeding product data.");

  logger.info("Creating offers for the demo seller...");
  const { data: seededProducts } = await query.graph({
    entity: "product",
    fields: ["id", "variants.id", "variants.sku"],
    filters: {
      handle: ["t-shirt", "sweatshirt", "sweatpants", "shorts"],
    },
  });

  const offers = seededProducts.flatMap((product) =>
    product.variants.map((variant: { id: string; sku: string | null }) => ({
      seller_id: demoSeller.id,
      created_by: demoSellerMemberId,
      sku: `OFFER-${variant.sku}`,
      variant_id: variant.id,
      shipping_profile_id: sellerShippingProfileId,
      inventory_items: [
        {
          sku: `OFFER-${variant.sku}`,
          stock_levels: [
            {
              location_id: sellerStockLocation.id,
              stocked_quantity: 1000000,
            },
          ],
        },
      ],
      prices: [
        { amount: 10, currency_code: "eur" },
        { amount: 15, currency_code: "usd" },
      ],
    }))
  );

  await createOffersWorkflow(container).run({ input: { offers } });
  logger.info("Finished creating offers for the demo seller.");

  logger.info("Finished seeding.");
}
