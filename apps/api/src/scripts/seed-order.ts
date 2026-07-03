import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  createCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  addSellerShippingMethodToCartWorkflow,
  completeCartWithSplitOrdersWorkflow,
} from "@mercurjs/core/workflows"

/**
 * Seed a completed order for one seller using that seller's offers and a
 * specific seller shipping option. Mirrors the store flow that
 * `complete-cart-with-split-orders` and `add-seller-shipping-method-to-cart`
 * expect:
 *
 *   1. create a guest cart (region, sales channel, shipping address)
 *   2. add every active seller offer as a line item (offer_id carries the
 *      pricing context that `setPricingContext` reads)
 *   3. add the seller's shipping option via the seller-aware workflow
 *   4. create a payment collection + a `pp_system_default` session
 *   5. complete the cart, which splits per seller into Orders + OrderGroup
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/seed-order.ts
 */
const SELLER_ID = "sel_01KT45ZAGFMME7RWVM0ZAKYGP5"
const SHIPPING_OPTION_ID = "so_01KTNY6Y4QC677N55P90AXN3QS"

type OfferRow = {
  id: string
  seller_id: string
  variant_id: string
}

type ShippingOptionRow = {
  id: string
  seller?: { id: string } | null
  service_zone?: {
    id: string
    geo_zones?: Array<{ type: string; country_code?: string | null }> | null
  } | null
  prices?: Array<{
    currency_code: string | null
    amount: number | null
    region_id?: string | null
  }> | null
}

export default async function seedOrderForSeller({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const regionModule = container.resolve(Modules.REGION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)

  logger.info(
    `Seeding order for seller ${SELLER_ID} using shipping option ${SHIPPING_OPTION_ID}`
  )

  // 1. seller
  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { id: SELLER_ID },
  })
  const seller = sellers[0]
  if (!seller) {
    throw new Error(`Seller ${SELLER_ID} not found`)
  }

  // 2. shipping option (must belong to seller)
  const { data: shippingOptions } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "seller.id",
      "service_zone.id",
      "service_zone.geo_zones.type",
      "service_zone.geo_zones.country_code",
      "prices.currency_code",
      "prices.amount",
      "prices.region_id",
      "rules.attribute",
      "rules.operator",
      "rules.value",
    ],
    filters: { id: SHIPPING_OPTION_ID },
  })
  const shippingOption = shippingOptions[0] as unknown as
    | (ShippingOptionRow & {
        rules?: Array<{
          attribute: string
          operator: string
          value: string | string[]
        }> | null
      })
    | undefined
  if (!shippingOption) {
    throw new Error(`Shipping option ${SHIPPING_OPTION_ID} not found`)
  }
  if (shippingOption.seller?.id !== SELLER_ID) {
    throw new Error(
      `Shipping option ${SHIPPING_OPTION_ID} does not belong to seller ${SELLER_ID}`
    )
  }
  const { data: shipProfileRows } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "shipping_profile_id",
      "service_zone.fulfillment_set_id",
    ],
    filters: { id: SHIPPING_OPTION_ID },
  })
  const shippingMeta = shipProfileRows[0] as
    | { service_zone?: { fulfillment_set_id?: string } | null }
    | undefined
  const shippingOptionFulfillmentSetId =
    shippingMeta?.service_zone?.fulfillment_set_id

  // 3. collect every country covered by the shipping option's geo zones —
  // query.graph paginates nested arrays, so go straight at fulfillmentModule
  if (!shippingOption.service_zone?.id) {
    throw new Error(
      `Shipping option ${SHIPPING_OPTION_ID} has no service zone`
    )
  }
  // listGeoZones caps at 50 per page; paginate so we see the full set
  const [, totalGeoZones] = await fulfillmentModule.listAndCountGeoZones(
    { type: "country" }
  )
  const optionCountries: string[] = []
  const PAGE = 50
  for (let skip = 0; skip < totalGeoZones; skip += PAGE) {
    const page = await fulfillmentModule.listGeoZones(
      { type: "country" },
      { take: PAGE, skip, relations: ["service_zone"] }
    )
    if (!page.length) break
    for (const g of page) {
      const zoneId =
        (g as { service_zone_id?: string }).service_zone_id ??
        (g as { service_zone?: { id?: string } }).service_zone?.id
      if (zoneId === shippingOption.service_zone.id && g.country_code) {
        optionCountries.push(g.country_code.toLowerCase())
      }
    }
  }
  if (!optionCountries.length) {
    throw new Error(
      `Shipping option ${SHIPPING_OPTION_ID} has no country geo zone to deliver to`
    )
  }

  // 4. find a region that covers any of those countries; if none does,
  // extend the first available region by adding one of the option's
  // countries (an already-assigned country can't be moved between regions)
  const regions = await regionModule.listRegions(
    {},
    { relations: ["countries"] }
  )
  if (!regions.length) {
    throw new Error("No regions configured — run the base seed first")
  }
  const optionCountrySet = new Set(optionCountries)
  let region: (typeof regions)[number] | undefined
  let optionCountry: string | undefined
  for (const r of regions) {
    const hit = r.countries?.find(
      (c) => c.iso_2 && optionCountrySet.has(c.iso_2.toLowerCase())
    )
    if (hit) {
      region = r
      optionCountry = hit.iso_2!.toLowerCase()
      break
    }
  }
  if (!region || !optionCountry) {
    // collect every country already pinned to any region so we don't try to
    // re-assign one (Medusa rejects that)
    const usedCountries = new Set<string>()
    for (const r of regions) {
      for (const c of r.countries ?? []) {
        if (c.iso_2) usedCountries.add(c.iso_2.toLowerCase())
      }
    }
    const candidate = optionCountries.find((c) => !usedCountries.has(c))
    if (!candidate) {
      throw new Error(
        `Every country in shipping option ${SHIPPING_OPTION_ID} is already assigned to another region`
      )
    }
    const target = regions[0]
    const existing = (target.countries ?? [])
      .map((c) => c.iso_2)
      .filter((iso): iso is string => Boolean(iso))
    await regionModule.updateRegions(target.id, {
      countries: [...existing, candidate],
    })
    region = (
      await regionModule.listRegions(
        { id: target.id },
        { relations: ["countries"] }
      )
    )[0]
    optionCountry = candidate
    logger.info(
      `Extended region '${region.name}' to cover '${candidate}' (shared with shipping option)`
    )
  }

  // 5. ensure a sales channel reaches the seller's fulfillment set.
  // listShippingOptionsForCartWithPricingWorkflow filters by
  // sales_channel.stock_locations.fulfillment_sets.id, so the cart MUST
  // be on a channel that sees the option's fulfillment set. We:
  //   a) find the seller's stock location (linked to their fulfillment set)
  //   b) link that stock location to the Default Sales Channel (idempotent)
  //   c) use the Default Sales Channel for the cart
  const [defaultSc] = await salesChannelModule.listSalesChannels(
    { name: "Default Sales Channel" },
    { take: 1 }
  )
  if (!defaultSc) {
    throw new Error("Default sales channel not found")
  }
  const salesChannel: { id: string; name: string } = defaultSc

  if (shippingOptionFulfillmentSetId) {
    const { data: slRows } = await query.graph({
      entity: "stock_locations",
      fields: ["id", "fulfillment_sets.id"],
      filters: {},
    })
    const sellerStockLocationId = (
      slRows as Array<{
        id: string
        fulfillment_sets?: Array<{ id: string }> | null
      }>
    ).find((sl) =>
      (sl.fulfillment_sets ?? []).some(
        (fs) => fs?.id === shippingOptionFulfillmentSetId
      )
    )?.id
    if (!sellerStockLocationId) {
      throw new Error(
        `No stock location is linked to fulfillment set ${shippingOptionFulfillmentSetId}`
      )
    }
    try {
      await link.create({
        [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
        [Modules.STOCK_LOCATION]: { stock_location_id: sellerStockLocationId },
      })
      logger.info(
        `Linked stock location ${sellerStockLocationId} to sales channel '${salesChannel.name}'`
      )
    } catch (e: unknown) {
      if (!(e instanceof Error && /already exists/i.test(e.message))) {
        throw e
      }
      logger.info(
        `Stock location ${sellerStockLocationId} already linked to sales channel '${salesChannel.name}'`
      )
    }
  }
  logger.info(
    `Using sales channel '${salesChannel.name}' (${salesChannel.id})`
  )

  // 6. seller offers (own columns only — variant is a remote link)
  const { data: offerRows } = await query.graph({
    entity: "offer",
    fields: ["id", "seller_id", "variant_id"],
    filters: { seller_id: SELLER_ID },
  })
  const offers = (offerRows as unknown as OfferRow[]).filter(
    (o) => typeof o.variant_id === "string" && o.variant_id.length > 0
  )
  if (!offers.length) {
    throw new Error(`Seller ${SELLER_ID} has no offers with a variant`)
  }

  // narrow to published variants by checking the product status via product module
  const productModule = container.resolve(Modules.PRODUCT)
  const variants = await productModule.listProductVariants(
    { id: offers.map((o) => o.variant_id) },
    { relations: ["product"], take: null }
  )
  const variantsById = new Map(variants.map((v) => [v.id, v]))
  const publishedOffers = offers.filter((o) => {
    const v = variantsById.get(o.variant_id)
    return v?.product?.status === "published"
  })
  if (!publishedOffers.length) {
    throw new Error(
      `Seller ${SELLER_ID} has offers but none point to a published product variant`
    )
  }

  logger.info(
    `Using region ${region.id} (${region.currency_code}), country '${optionCountry}', ${publishedOffers.length} offer(s)`
  )

  // 7. create the cart (guest)
  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      email: "seed-order@example.com",
      region_id: region.id,
      sales_channel_id: salesChannel.id,
      currency_code: region.currency_code,
      shipping_address: {
        first_name: "Seed",
        last_name: "Buyer",
        address_1: "123 Seed St",
        city: "Seed City",
        country_code: optionCountry,
        postal_code: "00000",
      },
      billing_address: {
        first_name: "Seed",
        last_name: "Buyer",
        address_1: "123 Seed St",
        city: "Seed City",
        country_code: optionCountry,
        postal_code: "00000",
      },
    },
  })
  logger.info(`Created cart ${cart.id}`)

  // 8. add every offer as line items in a single workflow run — calling
  // addToCartWorkflow once per offer makes the
  // `beforeRefreshingPaymentCollection` hook re-fire and try to re-link
  // an already-linked line item, which throws
  // "Cannot create multiple links between 'cart' and 'offer'"
  await addToCartWorkflow(container).run({
    input: {
      cart_id: cart.id,
      items: publishedOffers.map(
        (offer) =>
          ({
            variant_id: offer.variant_id,
            quantity: 1,
            // mirror /store/carts/:id/line-items: offer_id is read by the
            // validate hook at the top level and by setPricingContext from
            // either top-level or metadata.offer_id
            offer_id: offer.id,
            metadata: { offer_id: offer.id },
          }) as never,
      ),
    },
  })
  for (const offer of publishedOffers) {
    logger.info(`Added offer ${offer.id} (variant ${offer.variant_id})`)
  }

  // 9. attach the seller's shipping method
  await addSellerShippingMethodToCartWorkflow(container).run({
    input: {
      cart_id: cart.id,
      options: [{ id: SHIPPING_OPTION_ID }],
    },
  })
  logger.info(`Attached shipping option ${SHIPPING_OPTION_ID}`)

  // 10. payment collection + system session
  const { result: paymentCollection } =
    await createPaymentCollectionForCartWorkflow(container).run({
      input: { cart_id: cart.id },
    })

  await createPaymentSessionsWorkflow(container).run({
    input: {
      payment_collection_id: paymentCollection.id,
      provider_id: "pp_system_default",
    },
  })
  logger.info(`Initialized pp_system_default session on ${paymentCollection.id}`)

  // 11. complete cart → splits into per-seller orders inside an OrderGroup
  const { result, errors } = await completeCartWithSplitOrdersWorkflow(
    container
  ).run({
    input: { cart_id: cart.id },
    throwOnError: false,
  })

  if (errors?.length) {
    for (const e of errors) {
      logger.error(`complete-cart error: ${e.error?.message ?? e}`)
    }
    throw errors[0].error
  }

  const orderGroupId = result?.order_group_id
  if (!orderGroupId) {
    throw new Error("Cart completion did not return an order group id")
  }

  const { data: orderGroups } = await query.graph({
    entity: "order_group",
    fields: ["id", "orders.id", "orders.display_id", "orders.total"],
    filters: { id: orderGroupId },
  })
  const orderGroup = orderGroups[0]

  logger.info(
    `Order group ${orderGroup.id} created with ${
      orderGroup.orders?.length ?? 0
    } order(s):`
  )
  for (const order of orderGroup.orders ?? []) {
    if (!order) continue
    logger.info(`  - ${order.id} (#${order.display_id}) total=${order.total}`)
  }
}
