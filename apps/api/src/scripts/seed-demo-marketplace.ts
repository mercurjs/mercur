import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"
import { createOffersWorkflow } from "@mercurjs/core/workflows"
import {
  CreateOfferDTO,
  MercurModules,
  ProductStatus,
  SellerStatus,
} from "@mercurjs/types"

/**
 * Demo marketplace seed for the "competing offers per seller" story.
 *
 * Resets the catalog (offers, products, categories) and seeds five master
 * products, eight invented EU electronics sellers, and the offer spread the
 * Buy Box demo lingers on — multiple sellers listing the same master variant
 * at different prices/stock so the winner reads as score-driven, not just
 * lowest price.
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/seed-demo-marketplace.ts
 *
 * Requires the base store seed to have run first (sales channel, region,
 * stock location, shipping profile).
 */

const CURRENCY = "eur"

type SellerSeed = {
  name: string
  /** short code used in offer SKUs */
  code: string
  rating: number
  fulfillment: string
  country: string
  since: number
  /** ui-avatars background hex (no leading #) */
  color: string
}

const SELLERS: SellerSeed[] = [
  { name: "NordTech", code: "NORD", rating: 4.8, fulfillment: "Ships in 24h", country: "DE", since: 2016, color: "0D47A1" },
  { name: "PrimeGadgets", code: "PRIM", rating: 4.6, fulfillment: "Ships in 48h", country: "NL", since: 2018, color: "6A1B9A" },
  { name: "VoltMarket", code: "VOLT", rating: 4.4, fulfillment: "Ships in 24h", country: "PL", since: 2019, color: "2E7D32" },
  { name: "AudioHub", code: "AUDI", rating: 4.9, fulfillment: "Ships in 24h", country: "GB", since: 2015, color: "00838F" },
  { name: "HomePlus", code: "HOME", rating: 4.5, fulfillment: "Ships in 72h", country: "FR", since: 2014, color: "C62828" },
  { name: "GadgetWorks", code: "GADG", rating: 4.3, fulfillment: "Ships in 48h", country: "IE", since: 2020, color: "EF6C00" },
  { name: "ElectroMart", code: "ELEC", rating: 4.7, fulfillment: "Ships in 24h", country: "ES", since: 2017, color: "4527A0" },
  { name: "BlueCircuit", code: "BLUE", rating: 4.2, fulfillment: "Ships in 48h", country: "BE", since: 2021, color: "1565C0" },
]

type ProductSeed = {
  masterId: string
  title: string
  handle: string
  brand: string
  variant: string
  category: string
  ean: string
  description: string
  image: string
}

const CATEGORIES = ["Smartphones", "Headphones", "Home Appliances", "Accessories"]

const PRODUCTS: ProductSeed[] = [
  {
    masterId: "PRD-IP15-128-BLK",
    title: "Apple iPhone 15 128GB",
    handle: "apple-iphone-15-128gb",
    brand: "Apple",
    variant: "Black",
    category: "Smartphones",
    ean: "0190123450018",
    description:
      '6.1" Super Retina XDR OLED, A16 Bionic, 48MP main camera, USB-C, Dynamic Island.',
    image:
      "https://upload.wikimedia.org/wikipedia/commons/5/5d/Apple_iPhone_15.png",
  },
  {
    masterId: "PRD-XM5-BLK",
    title: "Sony WH-1000XM5 Wireless Headphones",
    handle: "sony-wh-1000xm5-wireless-headphones",
    brand: "Sony",
    variant: "Black",
    category: "Headphones",
    ean: "0190123450186",
    description:
      "Industry-leading noise cancelling over-ear headphones, 30h battery, LDAC, multipoint.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/b/b2/Sony_Headphones_%2840476165073%29.jpg",
  },
  {
    masterId: "PRD-GS24-256",
    title: "Samsung Galaxy S24 256GB",
    handle: "samsung-galaxy-s24-256gb",
    brand: "Samsung",
    variant: "Onyx Black",
    category: "Smartphones",
    ean: "0190123450254",
    description:
      '6.2" Dynamic AMOLED 2X 120Hz, Galaxy AI, 50MP triple camera, Snapdragon 8 Gen 3.',
    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/46/Samsung_Galaxy_S24_%28webtekno%29_008.png",
  },
  {
    masterId: "PRD-DYV15",
    title: "Dyson V15 Detect Cordless Vacuum",
    handle: "dyson-v15-detect-cordless-vacuum",
    brand: "Dyson",
    variant: "Yellow/Nickel",
    category: "Home Appliances",
    ean: "0190123450322",
    description:
      "Laser dust detection, HEPA filtration, up to 60 min runtime, LCD particle count.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/4/48/Dyson_vacuum_cleaner.jpg",
  },
  {
    masterId: "PRD-MXM3S",
    title: "Logitech MX Master 3S Mouse",
    handle: "logitech-mx-master-3s-mouse",
    brand: "Logitech",
    variant: "Graphite",
    category: "Accessories",
    ean: "0190123450490",
    description:
      "8K DPI sensor, quiet clicks, MagSpeed scroll, multi-device Flow, USB-C.",
    image:
      "https://upload.wikimedia.org/wikipedia/commons/3/39/Logitech_M331_Silent_Mouse.jpg",
  },
]

type OfferSeed = {
  masterId: string
  seller: string
  price: number
  stock: number
  condition: string
  buyboxWinner: boolean
}

const OFFERS: OfferSeed[] = [
  { masterId: "PRD-IP15-128-BLK", seller: "NordTech", price: 929, stock: 40, condition: "new", buyboxWinner: true },
  { masterId: "PRD-IP15-128-BLK", seller: "PrimeGadgets", price: 949, stock: 120, condition: "new", buyboxWinner: false },
  { masterId: "PRD-IP15-128-BLK", seller: "VoltMarket", price: 965, stock: 8, condition: "new", buyboxWinner: false },
  { masterId: "PRD-XM5-BLK", seller: "AudioHub", price: 299, stock: 35, condition: "new", buyboxWinner: true },
  { masterId: "PRD-XM5-BLK", seller: "NordTech", price: 319, stock: 60, condition: "new", buyboxWinner: false },
  { masterId: "PRD-GS24-256", seller: "NordTech", price: 739, stock: 15, condition: "new", buyboxWinner: true },
  { masterId: "PRD-GS24-256", seller: "PrimeGadgets", price: 749, stock: 50, condition: "new", buyboxWinner: false },
  { masterId: "PRD-GS24-256", seller: "VoltMarket", price: 769, stock: 22, condition: "new", buyboxWinner: false },
  { masterId: "PRD-DYV15", seller: "HomePlus", price: 629, stock: 18, condition: "new", buyboxWinner: true },
  { masterId: "PRD-DYV15", seller: "VoltMarket", price: 649, stock: 9, condition: "new", buyboxWinner: false },
  { masterId: "PRD-MXM3S", seller: "GadgetWorks", price: 95, stock: 12, condition: "new", buyboxWinner: false },
  { masterId: "PRD-MXM3S", seller: "PrimeGadgets", price: 99, stock: 200, condition: "new", buyboxWinner: false },
  { masterId: "PRD-MXM3S", seller: "NordTech", price: 105, stock: 85, condition: "new", buyboxWinner: true },
]

function logoUrl(seller: SellerSeed): string {
  const name = encodeURIComponent(seller.name)
  return `https://ui-avatars.com/api/?name=${name}&size=256&background=${seller.color}&color=fff&bold=true`
}

function bannerUrl(seller: SellerSeed): string {
  const name = encodeURIComponent(seller.name)
  return `https://placehold.co/1600x400/${seller.color}/ffffff/png?text=${name}&font=montserrat`
}

export default async function seedDemoMarketplace({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const productModule = container.resolve(Modules.PRODUCT)
  const inventoryModule = container.resolve(Modules.INVENTORY)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const regionModule = container.resolve(Modules.REGION)
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const sellerModule = container.resolve(MercurModules.SELLER)
  const offerModule = container.resolve(MercurModules.OFFER)

  // 1. resolve prerequisites from the base seed
  const [salesChannel] = await salesChannelModule.listSalesChannels(
    { name: "Default Sales Channel" },
    { take: 1 }
  )
  const [region] = await regionModule.listRegions(
    { currency_code: CURRENCY },
    { take: 1 }
  )
  const [stockLocation] = await stockLocationModule.listStockLocations(
    {},
    { take: 1 }
  )
  const [shippingProfile] = await fulfillmentModule.listShippingProfiles(
    { type: "default" },
    { take: 1 }
  )

  if (!salesChannel || !region || !stockLocation || !shippingProfile) {
    throw new Error(
      "Missing base store data (sales channel / region / stock location / shipping profile). Run `bun --cwd apps/api run medusa exec ./src/scripts/seed.ts` first."
    )
  }

  // 2. reset catalog: offers (+ their inventory items) -> products -> categories
  logger.info("Resetting catalog...")

  const { data: existingOffers } = await query.graph({
    entity: "offer",
    fields: ["id", "inventory_items.id"],
    pagination: { take: 1000, skip: 0 },
  })

  if (existingOffers.length) {
    const offerInventoryItemIds = [
      ...new Set(
        existingOffers.flatMap((o) =>
          (o.inventory_items ?? [])
            .map((i: { id?: string } | null) => i?.id)
            .filter((id): id is string => Boolean(id))
        )
      ),
    ]
    await offerModule.deleteOffers(existingOffers.map((o) => o.id))
    if (offerInventoryItemIds.length) {
      await inventoryModule.deleteInventoryItems(offerInventoryItemIds)
    }
    logger.info(
      `Deleted ${existingOffers.length} offer(s) and ${offerInventoryItemIds.length} offer inventory item(s).`
    )
  }

  const existingProducts = await productModule.listProducts(
    {},
    { select: ["id"], take: null }
  )
  if (existingProducts.length) {
    await deleteProductsWorkflow(container).run({
      input: { ids: existingProducts.map((p) => p.id) },
    })
    logger.info(`Deleted ${existingProducts.length} product(s).`)
  }

  const existingCategories = await productModule.listProductCategories(
    {},
    { select: ["id", "mpath"], take: null }
  )
  if (existingCategories.length) {
    // delete deepest-first: Medusa refuses to delete a category that still
    // has children, so order by materialized-path depth descending
    const depth = (c: { mpath?: string | null }) =>
      (c.mpath ?? "").split(".").filter(Boolean).length
    const ordered = [...existingCategories].sort((a, b) => depth(b) - depth(a))
    for (const category of ordered) {
      await productModule.deleteProductCategories(category.id)
    }
    logger.info(`Deleted ${existingCategories.length} category(ies).`)
  }

  // 3. sellers (idempotent — name is unique, sellers survive a catalog reset)
  logger.info("Seeding sellers...")
  const existingSellers = await sellerModule.listSellers(
    { name: SELLERS.map((s) => s.name) },
    { take: null }
  )
  const sellerByName = new Map<string, { id: string; name: string }>(
    existingSellers.map((s) => [s.name, s])
  )

  const sellersToCreate = SELLERS.filter((s) => !sellerByName.has(s.name)).map(
    (s) => ({
      name: s.name,
      email: `${s.name.toLowerCase()}@demo.mercur`,
      currency_code: CURRENCY,
      status: SellerStatus.OPEN,
      logo: logoUrl(s),
      banner: bannerUrl(s),
      description: `${s.name} — ${s.country}, trading since ${s.since}.`,
      metadata: {
        rating: s.rating,
        fulfillment: s.fulfillment,
        country: s.country,
        since: s.since,
      },
    })
  )

  if (sellersToCreate.length) {
    const created = await sellerModule.createSellers(sellersToCreate)
    for (const seller of created) {
      sellerByName.set(seller.name, seller)
    }
    logger.info(`Created ${sellersToCreate.length} seller(s).`)
  } else {
    logger.info("Sellers already exist, skipping creation.")
  }

  // give every store a banner: branded for the demo sellers, a neutral
  // default (their name on a slate background) for any pre-existing store
  const seedByName = new Map(SELLERS.map((s) => [s.name, s]))
  const allSellers = await sellerModule.listSellers(
    {},
    { select: ["id", "name", "logo"], take: null }
  )
  const sellerUpdates = allSellers.map((seller) => {
    const seed = seedByName.get(seller.name)
    if (seed) {
      return { id: seller.id, logo: logoUrl(seed), banner: bannerUrl(seed) }
    }
    const name = encodeURIComponent(seller.name)
    return {
      id: seller.id,
      banner: `https://placehold.co/1600x400/475569/ffffff/png?text=${name}&font=montserrat`,
    }
  })

  if (sellerUpdates.length) {
    await sellerModule.updateSellers(sellerUpdates)
    logger.info(`Set banner on ${sellerUpdates.length} store(s).`)
  }

  // 4. categories
  logger.info("Seeding categories...")
  const { result: createdCategories } = await createProductCategoriesWorkflow(
    container
  ).run({
    input: {
      product_categories: CATEGORIES.map((name) => ({
        name,
        is_active: true,
      })),
    },
  })
  const categoryByName = new Map(createdCategories.map((c) => [c.name, c.id]))

  // 5. master products — one variant each, no base price (offers carry the
  // price scoped by offer_id), manage_inventory off (offers own the stock)
  logger.info("Seeding master products...")
  const { result: createdProducts } = await createProductsWorkflow(
    container
  ).run({
    input: {
      products: PRODUCTS.map((p) => ({
        title: p.title,
        handle: p.handle,
        description: p.description,
        status: ProductStatus.PUBLISHED,
        category_ids: [categoryByName.get(p.category)!],
        shipping_profile_id: shippingProfile.id,
        thumbnail: p.image,
        images: [{ url: p.image }],
        metadata: { brand: p.brand, master_id: p.masterId },
        options: [{ title: "Color", values: [p.variant] }],
        variants: [
          {
            title: p.variant,
            sku: `${p.masterId}-MASTER`,
            ean: p.ean,
            manage_inventory: false,
            options: { Color: p.variant },
          },
        ],
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  })

  const variantByMaster = new Map<string, { variantId: string; ean: string }>()
  for (const product of createdProducts) {
    const masterId = (product.metadata?.master_id as string) ?? ""
    const variant = product.variants?.[0]
    const seed = PRODUCTS.find((p) => p.masterId === masterId)
    if (masterId && variant && seed) {
      variantByMaster.set(masterId, { variantId: variant.id, ean: seed.ean })
    }
  }
  logger.info(`Created ${createdProducts.length} master product(s).`)

  // 6. offers — one workflow run per seller, because the create-offers
  // workflow links every inventory item in a run to offers[0].seller_id
  logger.info("Seeding offers...")
  const offersBySeller = new Map<string, OfferSeed[]>()
  for (const offer of OFFERS) {
    const list = offersBySeller.get(offer.seller) ?? []
    list.push(offer)
    offersBySeller.set(offer.seller, list)
  }

  let offerCount = 0
  for (const [sellerName, sellerOffers] of offersBySeller) {
    const seller = sellerByName.get(sellerName)
    const seed = seedByName.get(sellerName)
    if (!seller || !seed) {
      throw new Error(`Seller ${sellerName} not found`)
    }

    const offers: CreateOfferDTO[] = sellerOffers.map((o) => {
      const master = variantByMaster.get(o.masterId)
      if (!master) {
        throw new Error(`Master product ${o.masterId} not found`)
      }
      // short, readable SKU: drop the PRD- prefix, use the seller code
      const sku = `${o.masterId.replace(/^PRD-/, "")}-${seed.code}`
      return {
        seller_id: seller.id,
        created_by: seller.id,
        sku,
        variant_id: master.variantId,
        shipping_profile_id: shippingProfile.id,
        ean: master.ean,
        inventory_items: [
          {
            sku,
            required_quantity: 1,
            stock_levels: [
              { location_id: stockLocation.id, stocked_quantity: o.stock },
            ],
          },
        ],
        prices: [{ amount: o.price, currency_code: CURRENCY }],
        metadata: {
          condition: o.condition,
          buybox_winner: o.buyboxWinner,
          seller_rating: seed.rating,
          seller_fulfillment: seed.fulfillment,
        },
      }
    })

    await createOffersWorkflow(container).run({ input: { offers } })
    offerCount += offers.length
    logger.info(`  ${sellerName}: ${offers.length} offer(s)`)
  }

  logger.info(
    `Finished seeding demo marketplace: ${SELLERS.length} sellers, ${createdProducts.length} products, ${offerCount} offers.`
  )
}
