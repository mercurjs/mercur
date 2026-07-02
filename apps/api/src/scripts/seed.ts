import { ExecArgs, FulfillmentWorkflow } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { AttributeType, MercurModules, ProductStatus } from "@mercurjs/types";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingProfilesWorkflow,
  createTaxRegionsWorkflow,
  deleteProductsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresStep,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import { ApiKey } from "../../.medusa/types/query-entry-points";
import {
  addProductAttributesToProductWorkflow,
  approveSellerWorkflow,
  createOffersWorkflow,
  createProductAttributesWorkflow,
  createProductCategoryWithImagesWorkflow,
  createProductCollectionWithImagesWorkflow,
  createProductsWorkflow,
  createSellerAccountWorkflow,
  createSellerDefaultsWorkflow,
  createSellerShippingOptionsWorkflow,
  createSellerStockLocationsWorkflow,
  deleteOffersWorkflow,
  deleteSellersWorkflow,
} from "@mercurjs/core/workflows";

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

const SELLER_PASSWORD = "supersecret";

type SellerBlueprint = {
  name: string;
  handle: string;
  email: string;
  description: string;
};

type ProductBlueprint = {
  title: string;
  handle: string;
  sellerHandle: string;
  category: string;
  collection?: string;
  description: string;
  sizes: string[];
  colors?: string[];
  priceEur: number;
  priceUsd: number;
  offer?: boolean;
};

const SELLER_BLUEPRINTS: SellerBlueprint[] = [
  {
    name: "Nike",
    handle: "nike",
    email: "nike@mercur-demo.com",
    description:
      "Performance sneakers and sportswear built to move with you.",
  },
  {
    name: "Prada",
    handle: "prada",
    email: "prada@mercur-demo.com",
    description: "Italian leather footwear and refined everyday luxury.",
  },
  {
    name: "Balenciaga",
    handle: "balenciaga",
    email: "balenciaga@mercur-demo.com",
    description: "Statement sneakers, sandals and accessories.",
  },
];

// Handles must match the hardcoded storefront home carousel
// (apps/storefront HomeCategories) or its category links 404.
const CATEGORY_NAMES = ["Sneakers", "Sandals", "Boots", "Sport", "Accessories"];

const COLLECTIONS = [
  { title: "New Arrivals", handle: "new-arrivals", imageKeyword: "sneakers" },
  { title: "Summer Essentials", handle: "summer-essentials", imageKeyword: "sandals" },
  { title: "Best Sellers", handle: "best-sellers", imageKeyword: "boots" },
];

// loremflickr serves real, keyword-matched photos and is deterministic via
// ?lock=, so the storefront always renders a relevant image. Any host is
// allowed by the storefront next.config remotePatterns wildcard.
const CATEGORY_IMAGE_KEYWORD: Record<string, string> = {
  Sneakers: "sneakers",
  Sandals: "sandals",
  Boots: "boots",
  Sport: "running,shoes",
  Accessories: "cap",
};

const SHOE_SIZES = ["40", "41", "42", "43", "44", "45"];
const ONE_SIZE = ["One Size"];

const PRODUCT_BLUEPRINTS: ProductBlueprint[] = [
  {
    title: "Nike Air Zoom Pegasus",
    handle: "nike-air-zoom-pegasus",
    sellerHandle: "nike",
    category: "Sneakers",
    collection: "New Arrivals",
    description:
      "Responsive everyday running sneaker with a springy Zoom Air unit.",
    sizes: SHOE_SIZES,
    colors: ["Black", "White"],
    priceEur: 120,
    priceUsd: 130,
    offer: true,
  },
  {
    title: "Nike Revolution Runner",
    handle: "nike-revolution-runner",
    sellerHandle: "nike",
    category: "Sport",
    collection: "Best Sellers",
    description: "Lightweight trainer for gym sessions and daily miles.",
    sizes: SHOE_SIZES,
    priceEur: 80,
    priceUsd: 90,
    offer: true,
  },
  {
    title: "Nike Court Legacy",
    handle: "nike-court-legacy",
    sellerHandle: "nike",
    category: "Sneakers",
    description: "Retro tennis-inspired low top with a clean silhouette.",
    sizes: SHOE_SIZES,
    colors: ["White", "Navy"],
    priceEur: 75,
    priceUsd: 85,
  },
  {
    title: "Nike Pegasus Trail",
    handle: "nike-pegasus-trail",
    sellerHandle: "nike",
    category: "Sport",
    description: "Rugged trail runner with grippy outsole for off-road runs.",
    sizes: SHOE_SIZES,
    priceEur: 140,
    priceUsd: 150,
  },
  {
    title: "Nike Sportswear Cap",
    handle: "nike-sportswear-cap",
    sellerHandle: "nike",
    category: "Accessories",
    description: "Adjustable cotton cap with embroidered logo.",
    sizes: ONE_SIZE,
    priceEur: 25,
    priceUsd: 30,
    offer: true,
  },
  {
    title: "Prada Leather Chelsea Boot",
    handle: "prada-leather-chelsea-boot",
    sellerHandle: "prada",
    category: "Boots",
    collection: "New Arrivals",
    description: "Handcrafted Italian leather Chelsea boot with elastic gores.",
    sizes: SHOE_SIZES,
    colors: ["Black", "Brown"],
    priceEur: 950,
    priceUsd: 1050,
    offer: true,
  },
  {
    title: "Prada Monolith Boot",
    handle: "prada-monolith-boot",
    sellerHandle: "prada",
    category: "Boots",
    collection: "Best Sellers",
    description: "Brushed leather combat boot on a chunky lug sole.",
    sizes: SHOE_SIZES,
    priceEur: 1200,
    priceUsd: 1300,
  },
  {
    title: "Prada Suede Loafer",
    handle: "prada-suede-loafer",
    sellerHandle: "prada",
    category: "Sneakers",
    description: "Soft suede loafer with a leather sole for smart comfort.",
    sizes: SHOE_SIZES,
    colors: ["Tan", "Grey"],
    priceEur: 780,
    priceUsd: 860,
  },
  {
    title: "Prada Leather Sandal",
    handle: "prada-leather-sandal",
    sellerHandle: "prada",
    category: "Sandals",
    collection: "Summer Essentials",
    description: "Minimal leather slide sandal for warm-weather styling.",
    sizes: SHOE_SIZES,
    priceEur: 620,
    priceUsd: 690,
    offer: true,
  },
  {
    title: "Prada Nylon Pouch",
    handle: "prada-nylon-pouch",
    sellerHandle: "prada",
    category: "Accessories",
    description: "Signature Re-Nylon pouch with enamel triangle logo.",
    sizes: ONE_SIZE,
    priceEur: 490,
    priceUsd: 540,
  },
  {
    title: "Balenciaga Triple S",
    handle: "balenciaga-triple-s",
    sellerHandle: "balenciaga",
    category: "Sneakers",
    collection: "Best Sellers",
    description: "Oversized layered-sole sneaker in a bold chunky profile.",
    sizes: SHOE_SIZES,
    colors: ["White", "Black"],
    priceEur: 895,
    priceUsd: 995,
    offer: true,
  },
  {
    title: "Balenciaga Speed Trainer",
    handle: "balenciaga-speed-trainer",
    sellerHandle: "balenciaga",
    category: "Sneakers",
    collection: "New Arrivals",
    description: "Sock-fit knit trainer with a streamlined running sole.",
    sizes: SHOE_SIZES,
    priceEur: 750,
    priceUsd: 830,
  },
  {
    title: "Balenciaga Track Sandal",
    handle: "balenciaga-track-sandal",
    sellerHandle: "balenciaga",
    category: "Sandals",
    collection: "Summer Essentials",
    description: "Technical strap sandal built on the Track outsole.",
    sizes: SHOE_SIZES,
    priceEur: 550,
    priceUsd: 610,
    offer: true,
  },
  {
    title: "Balenciaga Pool Slide",
    handle: "balenciaga-pool-slide",
    sellerHandle: "balenciaga",
    category: "Sandals",
    collection: "Summer Essentials",
    description: "Moulded logo slide for poolside and off-duty looks.",
    sizes: SHOE_SIZES,
    priceEur: 350,
    priceUsd: 390,
  },
  {
    title: "Balenciaga Logo Cap",
    handle: "balenciaga-logo-cap",
    sellerHandle: "balenciaga",
    category: "Accessories",
    description: "Structured cotton cap with contrast logo embroidery.",
    sizes: ONE_SIZE,
    priceEur: 320,
    priceUsd: 360,
    offer: true,
  },
];

// Global, filterable attributes surfaced in the storefront sidebar. Each is a
// single-select scoped to every seeded category; products are tagged with one
// value per attribute below so search facets carry non-zero counts.
type FilterAttributeBlueprint = {
  name: string;
  handle: string;
  values: string[];
};

const FILTER_ATTRIBUTE_BLUEPRINTS: FilterAttributeBlueprint[] = [
  { name: "Brand", handle: "brand", values: ["Nike", "Prada", "Balenciaga"] },
  {
    name: "Material",
    handle: "material",
    values: ["Leather", "Suede", "Textile", "Nylon", "Rubber"],
  },
  { name: "Gender", handle: "gender", values: ["Men", "Women", "Unisex"] },
];

// Per-product filter values (Brand is derived from the product's seller).
const PRODUCT_FILTER_VALUES: Record<
  string,
  { material: string; gender: string }
> = {
  "nike-air-zoom-pegasus": { material: "Textile", gender: "Men" },
  "nike-revolution-runner": { material: "Textile", gender: "Unisex" },
  "nike-court-legacy": { material: "Leather", gender: "Men" },
  "nike-pegasus-trail": { material: "Textile", gender: "Men" },
  "nike-sportswear-cap": { material: "Textile", gender: "Unisex" },
  "prada-leather-chelsea-boot": { material: "Leather", gender: "Men" },
  "prada-monolith-boot": { material: "Leather", gender: "Unisex" },
  "prada-suede-loafer": { material: "Suede", gender: "Men" },
  "prada-leather-sandal": { material: "Leather", gender: "Women" },
  "prada-nylon-pouch": { material: "Nylon", gender: "Unisex" },
  "balenciaga-triple-s": { material: "Textile", gender: "Unisex" },
  "balenciaga-speed-trainer": { material: "Textile", gender: "Unisex" },
  "balenciaga-track-sandal": { material: "Rubber", gender: "Women" },
  "balenciaga-pool-slide": { material: "Rubber", gender: "Unisex" },
  "balenciaga-logo-cap": { material: "Textile", gender: "Unisex" },
};

const loremflickr = (keyword: string, lock: number) =>
  `https://loremflickr.com/800/800/${keyword}?lock=${lock}`;

function categoryImageUrl(category: string, index: number) {
  return loremflickr(CATEGORY_IMAGE_KEYWORD[category] ?? "shoes", 2000 + index);
}

function buildImages(category: string, index: number) {
  const keyword = CATEGORY_IMAGE_KEYWORD[category] ?? "shoes";
  const lock = 1000 + index;
  return [lock, lock + 500].map((seed) => ({
    url: loremflickr(keyword, seed),
  }));
}

// Variant axes are expressed as inline is_variant_axis attributes; the Mercur
// product workflow turns each into a product option (title -> values).
function buildAttributes(bp: ProductBlueprint) {
  const attributes: {
    title: string;
    values: string[];
    is_variant_axis: boolean;
  }[] = [{ title: "Size", values: bp.sizes, is_variant_axis: true }];
  if (bp.colors?.length) {
    attributes.push({
      title: "Color",
      values: bp.colors,
      is_variant_axis: true,
    });
  }
  return attributes;
}

function buildVariants(bp: ProductBlueprint) {
  const colors = bp.colors ?? [null];
  const variants: {
    title: string;
    sku: string;
    options: Record<string, string>;
    prices: { amount: number; currency_code: string }[];
  }[] = [];

  for (const size of bp.sizes) {
    for (const color of colors) {
      const options: Record<string, string> = color
        ? { Size: size, Color: color }
        : { Size: size };
      const title = color ? `${size} / ${color}` : size;
      const sku = [bp.handle.toUpperCase(), size, color?.toUpperCase()]
        .filter(Boolean)
        .join("-")
        .replace(/\s+/g, "-");
      variants.push({
        title,
        sku,
        options,
        prices: [
          { amount: bp.priceEur, currency_code: "eur" },
          { amount: bp.priceUsd, currency_code: "usd" },
        ],
      });
    }
  }

  return variants;
}

// Full reset of catalog data so a re-run produces a clean, known dataset.
// Sellers/members/offers/products all soft-delete (email + handle uniqueness is
// scoped to non-deleted rows), but auth identities and members would otherwise
// collide when the seed recreates the same sellers, so they are cleared too.
async function resetCatalog(container: ExecArgs["container"]) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const authModuleService = container.resolve(Modules.AUTH);
  const sellerModuleService = container.resolve(MercurModules.SELLER) as unknown as {
    softDeleteMembers: (ids: string[]) => Promise<unknown>;
  };

  logger.info("Resetting catalog: removing existing offers, products, and sellers...");

  const { data: offers } = await query.graph({
    entity: "offer",
    fields: ["id"],
  });
  if (offers.length) {
    await deleteOffersWorkflow(container).run({
      input: { ids: offers.map((offer) => offer.id) },
    });
    logger.info(`Removed ${offers.length} offer(s).`);
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id"],
  });
  if (products.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: products.map((product) => product.id) },
    });
    logger.info(`Removed ${products.length} product(s).`);
  }

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "email", "members.id", "members.email"],
  });
  if (sellers.length) {
    const emails = new Set<string>();
    const memberIds = new Set<string>();
    for (const seller of sellers) {
      if (seller.email) {
        emails.add(seller.email);
      }
      for (const member of seller.members ?? []) {
        if (member?.email) {
          emails.add(member.email);
        }
        if (member?.id) {
          memberIds.add(member.id);
        }
      }
    }

    await deleteSellersWorkflow(container).run({
      input: { ids: sellers.map((seller) => seller.id) },
    });

    if (memberIds.size) {
      await sellerModuleService.softDeleteMembers([...memberIds]);
    }

    const authIdentities = await authModuleService.listAuthIdentities(
      {},
      { relations: ["provider_identities"] }
    );
    const authIdentityIds = authIdentities
      .filter((identity) =>
        identity.provider_identities?.some(
          (provider) => provider.entity_id && emails.has(provider.entity_id)
        )
      )
      .map((identity) => identity.id);
    if (authIdentityIds.length) {
      await authModuleService.deleteAuthIdentities(authIdentityIds);
    }

    logger.info(`Removed ${sellers.length} seller(s).`);
  }

  logger.info("Catalog reset complete.");
}

export default async function seedDemoData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const storeModuleService = container.resolve(Modules.STORE);

  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"];

  await resetCatalog(container);

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


  logger.info("Seeding fulfillment data...");
  const shippingProfiles = await fulfillmentModuleService.listShippingProfiles({
    type: "default",
  });
  let shippingProfile = shippingProfiles.length ? shippingProfiles[0] : null;

  if (!shippingProfile) {
    const { result: shippingProfileResult } =
      await createShippingProfilesWorkflow(container).run({
        input: {
          data: [
            {
              name: "Default Shipping Profile",
              type: "default",
            },
          ],
        },
      });
    shippingProfile = shippingProfileResult[0];
  }

  // Fulfillment sets and shipping options are created per seller below.
  logger.info("Finished seeding fulfillment data.");

  logger.info("Seeding publishable API key data...");
  let publishableApiKey: ApiKey | null = null;
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

    publishableApiKey = publishableApiKeyResult as ApiKey;
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

  // Seller default roles/config must exist before seller accounts are created.
  await createSellerDefaultsWorkflow(container).run({});

  logger.info("Seeding sellers...");
  const authModuleService = container.resolve(Modules.AUTH);
  const sellersByHandle = new Map<
    string,
    { id: string; memberId: string; locationId?: string }
  >();

  for (const sellerBlueprint of SELLER_BLUEPRINTS) {
    const { data: existingSellers } = await query.graph({
      entity: "seller",
      fields: ["id"],
      filters: { handle: sellerBlueprint.handle },
    });

    let sellerId: string;
    if (existingSellers.length) {
      sellerId = existingSellers[0].id;
      logger.info(`Seller '${sellerBlueprint.name}' already exists, skipping.`);
    } else {
      const authIdentity = await authModuleService.createAuthIdentities({
        provider_identities: [
          {
            provider: "emailpass",
            entity_id: sellerBlueprint.email,
            provider_metadata: { password: SELLER_PASSWORD },
          },
        ],
      });

      const { result: seller } = await createSellerAccountWorkflow(container).run({
        input: {
          auth_identity_id: authIdentity.id,
          member_email: sellerBlueprint.email,
          seller: {
            name: sellerBlueprint.name,
            handle: sellerBlueprint.handle,
            email: sellerBlueprint.email,
            description: sellerBlueprint.description,
            currency_code: "eur",
          },
        },
      });

      await approveSellerWorkflow(container).run({
        input: { seller_id: seller.id },
      });

      sellerId = seller.id;
    }

    const { data: memberRows } = await query.graph({
      entity: "member",
      fields: ["id"],
      filters: { email: sellerBlueprint.email },
    });

    sellersByHandle.set(sellerBlueprint.handle, {
      id: sellerId,
      memberId: memberRows[0].id,
    });
  }
  logger.info("Finished seeding sellers.");

  logger.info("Seeding seller stock locations and shipping options...");
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
  const sellerGeoZones = countries.map((country_code) => ({
    country_code,
    type: "country" as const,
  }));

  for (const sellerBlueprint of SELLER_BLUEPRINTS) {
    const seller = sellersByHandle.get(sellerBlueprint.handle);
    if (!seller) {
      continue;
    }

    const locationName = `${sellerBlueprint.name} Warehouse`;
    const existingSellerLocations =
      await stockLocationModule.listStockLocations({ name: locationName });
    if (existingSellerLocations.length) {
      seller.locationId = existingSellerLocations[0].id;
      logger.info(
        `Fulfillment for '${sellerBlueprint.name}' already exists, skipping.`
      );
      continue;
    }

    // Seller-scoped stock location (also creates the stock_location_seller link).
    const { result: sellerLocations } = await createSellerStockLocationsWorkflow(
      container
    ).run({
      input: {
        seller_id: seller.id,
        locations: [
          {
            name: locationName,
            address: {
              city: "Copenhagen",
              country_code: "DK",
              address_1: "",
            },
          },
        ],
      },
    });
    const sellerLocation = sellerLocations[0];
    seller.locationId = sellerLocation.id;

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: sellerLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });

    const sellerFulfillmentSet =
      await fulfillmentModuleService.createFulfillmentSets({
        name: `${sellerBlueprint.name} delivery`,
        type: "shipping",
        service_zones: [{ name: "Europe", geo_zones: sellerGeoZones }],
      });

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: sellerLocation.id },
      [Modules.FULFILLMENT]: {
        fulfillment_set_id: sellerFulfillmentSet.id,
      },
    });

    const serviceZoneId = sellerFulfillmentSet.service_zones[0].id;
    const sellerShippingOption = (
      label: string,
      code: string,
      description: string
    ): FulfillmentWorkflow.CreateShippingOptionsWorkflowInput => ({
      name: `${label} Shipping`,
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: serviceZoneId,
      shipping_profile_id: shippingProfile.id,
      type: { label, description, code },
      prices: [
        { currency_code: "usd", amount: 10 },
        { currency_code: "eur", amount: 10 },
        { region_id: region.id, amount: 10 },
      ],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    });

    await createSellerShippingOptionsWorkflow(container).run({
      input: {
        seller_id: seller.id,
        shipping_options: [
          sellerShippingOption("Standard", "standard", "Ship in 2-3 days."),
          sellerShippingOption("Express", "express", "Ship in 24 hours."),
        ],
      },
    });

    // Fulfillment is only available at checkout once the location is linked to
    // the sales channel.
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: {
        id: sellerLocation.id,
        add: [defaultSalesChannel[0].id],
      },
    });
  }
  logger.info("Finished seeding seller stock locations and shipping options.");

  logger.info("Seeding product data...");

  const productModule = container.resolve(Modules.PRODUCT);

  // Dedup by handle: categories are created with handle = name.toLowerCase(),
  // and pre-existing categories may carry a different display name.
  // query.graph is used (not productModule.listProductCategories) because the
  // module service returns entities whose handle/name are not readable here.
  const categoryHandles = CATEGORY_NAMES.map((name) => name.toLowerCase());
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle"],
    filters: { handle: categoryHandles },
  });
  const categoryIdByHandle = new Map<string, string>(
    existingCategories.map((c) => [c.handle, c.id])
  );
  const categoryIdByName = new Map<string, string>();
  for (const name of CATEGORY_NAMES) {
    const existingId = categoryIdByHandle.get(name.toLowerCase());
    if (existingId) {
      categoryIdByName.set(name, existingId);
    }
  }

  for (const [index, name] of CATEGORY_NAMES.entries()) {
    if (categoryIdByName.has(name)) {
      continue;
    }
    const imageUrl = categoryImageUrl(name, index);
    // media_images is the Mercur backend mechanism (admin/vendor); the
    // storefront reads metadata.image_url, so set both.
    const { result: categoryId } = await createProductCategoryWithImagesWorkflow(
      container
    ).run({
      input: {
        product_category: {
          name,
          handle: name.toLowerCase(),
          is_active: true,
          metadata: { image_url: imageUrl },
        },
        media: [{ url: imageUrl, is_thumbnail: true }],
      },
    });
    categoryIdByName.set(name, categoryId);
  }

  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "handle"],
    filters: { handle: COLLECTIONS.map((c) => c.handle) },
  });
  const collectionIdByHandle = new Map<string, string>(
    existingCollections.map((c) => [c.handle, c.id])
  );
  const collectionIdByTitle = new Map<string, string>();
  for (const collection of COLLECTIONS) {
    const existingId = collectionIdByHandle.get(collection.handle);
    if (existingId) {
      collectionIdByTitle.set(collection.title, existingId);
    }
  }

  for (const [index, collection] of COLLECTIONS.entries()) {
    if (collectionIdByTitle.has(collection.title)) {
      continue;
    }
    const imageUrl = loremflickr(collection.imageKeyword, 3000 + index);
    const { result: collectionId } =
      await createProductCollectionWithImagesWorkflow(container).run({
        input: {
          collection: {
            title: collection.title,
            handle: collection.handle,
            metadata: { image_url: imageUrl },
          },
          media: [{ url: imageUrl, is_thumbnail: true }],
        },
      });
    collectionIdByTitle.set(collection.title, collectionId);
  }

  const productHandles = PRODUCT_BLUEPRINTS.map((b) => b.handle);
  const existingProducts = await productModule.listProducts({
    handle: productHandles,
  });
  const existingHandles = new Set(existingProducts.map((p) => p.handle));
  const blueprintsToCreate = PRODUCT_BLUEPRINTS.filter(
    (b) => !existingHandles.has(b.handle)
  );

  if (!blueprintsToCreate.length) {
    logger.info("Products already exist, skipping.");
  } else {
    // One workflow run per seller so seller_ids/created_by scope the products
    // to their owner.
    for (const sellerBlueprint of SELLER_BLUEPRINTS) {
      const seller = sellersByHandle.get(sellerBlueprint.handle);
      if (!seller) {
        continue;
      }
      const sellerProducts = blueprintsToCreate.filter(
        (b) => b.sellerHandle === sellerBlueprint.handle
      );
      if (!sellerProducts.length) {
        continue;
      }

      await createProductsWorkflow(container).run({
        input: {
          created_by: seller.memberId,
          products: sellerProducts.map((bp) => ({
            title: bp.title,
            handle: bp.handle,
            description: bp.description,
            status: ProductStatus.PUBLISHED,
            weight: 400,
            shipping_profile_id: shippingProfile.id,
            category_ids: [categoryIdByName.get(bp.category)!],
            collection_id: bp.collection
              ? collectionIdByTitle.get(bp.collection)
              : undefined,
            images: buildImages(bp.category, PRODUCT_BLUEPRINTS.indexOf(bp)),
            attributes: buildAttributes(bp),
            variants: buildVariants(bp),
            sales_channels: [{ id: defaultSalesChannel[0].id }],
            seller_ids: [seller.id],
          })),
        },
      });
    }
  }
  logger.info("Finished seeding product data.");

  const { data: seedProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "variants.id"],
    filters: { handle: productHandles },
  });
  const productByHandle = new Map(seedProducts.map((p) => [p.handle, p]));

  logger.info("Seeding offers...");
  for (const bp of PRODUCT_BLUEPRINTS.filter((b) => b.offer)) {
    const product = productByHandle.get(bp.handle);
    const seller = sellersByHandle.get(bp.sellerHandle);
    if (!product?.variants?.length || !seller?.locationId) {
      continue;
    }

    const offerSku = `OFFER-${bp.handle.toUpperCase()}`;
    const { data: existingOffers } = await query.graph({
      entity: "offer",
      fields: ["id"],
      filters: { seller_id: seller.id, sku: offerSku },
    });
    if (existingOffers.length) {
      continue;
    }

    await createOffersWorkflow(container).run({
      input: {
        offers: [
          {
            seller_id: seller.id,
            created_by: seller.memberId,
            sku: offerSku,
            variant_id: product.variants[0].id,
            shipping_profile_id: shippingProfile.id,
            inventory_items: [
              {
                title: `${bp.title} stock`,
                required_quantity: 1,
                stock_levels: [
                  {
                    location_id: seller.locationId,
                    stocked_quantity: 100,
                  },
                ],
              },
            ],
            prices: [
              { amount: bp.priceEur, currency_code: "eur" },
              { amount: bp.priceUsd, currency_code: "usd" },
            ],
          },
        ],
      },
    });
  }
  logger.info("Finished seeding offers.");

  logger.info("Seeding filterable product attributes...");

  // Scope every attribute to all seeded categories so the filters show on each
  // category listing (and on the all-products listing, which has no category).
  const attributeCategoryIds = [...new Set(categoryIdByName.values())];
  const attributeHandles = FILTER_ATTRIBUTE_BLUEPRINTS.map((a) => a.handle);

  const { data: existingAttributes } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "handle"],
    filters: { handle: attributeHandles },
  });
  const existingAttributeHandles = new Set(
    existingAttributes.map((a) => a.handle)
  );
  const attributesToCreate = FILTER_ATTRIBUTE_BLUEPRINTS.filter(
    (a) => !existingAttributeHandles.has(a.handle)
  );

  if (attributesToCreate.length) {
    await createProductAttributesWorkflow(container).run({
      input: {
        attributes: attributesToCreate.map((attribute, index) => ({
          name: attribute.name,
          handle: attribute.handle,
          type: AttributeType.SINGLE_SELECT,
          is_filterable: true,
          is_variant_axis: false,
          rank: index,
          category_ids: attributeCategoryIds,
          values: attribute.values.map((name, valueIndex) => ({
            name,
            rank: valueIndex,
          })),
        })),
      },
    });
  }

  // Read attributes back with their values so products can be tagged by value id.
  const { data: attributesWithValues } = await query.graph({
    entity: "product_attribute",
    fields: ["id", "handle", "values.id", "values.name"],
    filters: { handle: attributeHandles },
  });
  const attributeIdByHandle = new Map<string, string>();
  const valueIdByHandleAndName = new Map<string, string>();
  for (const attribute of attributesWithValues) {
    if (!attribute.handle) {
      continue;
    }
    attributeIdByHandle.set(attribute.handle, attribute.id);
    for (const value of attribute.values ?? []) {
      if (value?.name && value?.id) {
        valueIdByHandleAndName.set(`${attribute.handle}:${value.name}`, value.id);
      }
    }
  }

  const sellerNameByHandle = new Map(
    SELLER_BLUEPRINTS.map((seller) => [seller.handle, seller.name])
  );

  for (const bp of PRODUCT_BLUEPRINTS) {
    const product = productByHandle.get(bp.handle);
    if (!product) {
      continue;
    }

    const filters = PRODUCT_FILTER_VALUES[bp.handle];
    const selections: Array<{ handle: string; value?: string }> = [
      { handle: "brand", value: sellerNameByHandle.get(bp.sellerHandle) },
      { handle: "material", value: filters?.material },
      { handle: "gender", value: filters?.gender },
    ];

    const add: Array<{ id: string; value_ids: string[] }> = [];
    for (const { handle, value } of selections) {
      if (!value) {
        continue;
      }
      const attributeId = attributeIdByHandle.get(handle);
      const valueId = valueIdByHandleAndName.get(`${handle}:${value}`);
      if (attributeId && valueId) {
        add.push({ id: attributeId, value_ids: [valueId] });
      }
    }

    if (add.length) {
      await addProductAttributesToProductWorkflow(container).run({
        input: { product_id: product.id, add },
      });
    }
  }
  logger.info("Finished seeding filterable product attributes.");

  // Attribute links are added after products were first indexed, so trigger a
  // full reindex to refresh the (in-memory) search facets on the running server.
  logger.info("Triggering search reindex...");
  const eventBusModuleService = container.resolve(Modules.EVENT_BUS);
  await eventBusModuleService.emit({ name: "search.reindex", data: {} });

  logger.info("Finished seeding seller data.");
}
