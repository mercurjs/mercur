import { MedusaContainer } from "@medusajs/framework/types"
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
 * Create one completed order for a seller by driving the same store checkout
 * flow that `seed-order.ts` uses (guest cart → seller offers → seller shipping
 * method → payment collection + system session → complete + split). Returns the
 * orders created inside the resulting OrderGroup.
 *
 * The seller's shipping option is auto-discovered when `shippingOptionId` is
 * omitted, so callers only need a seller id.
 */

type OfferRow = {
  id: string
  seller_id: string
  variant_id: string
}

export type SeededOrder = {
  id: string
  display_id: number
}

export async function seedSellerOrder(
  container: MedusaContainer,
  opts: { sellerId: string; shippingOptionId?: string; email?: string }
): Promise<SeededOrder[]> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const regionModule = container.resolve(Modules.REGION)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const productModule = container.resolve(Modules.PRODUCT)

  const { sellerId, email = "seed-order@example.com" } = opts

  // 1. resolve a shipping option that belongs to the seller
  let shippingOptionId = opts.shippingOptionId
  if (!shippingOptionId) {
    const { data: sellerOptions } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "seller.id"],
      filters: {},
    })
    shippingOptionId = (
      sellerOptions as Array<{ id: string; seller?: { id: string } | null }>
    ).find((o) => o.seller?.id === sellerId)?.id
    if (!shippingOptionId) {
      throw new Error(`Seller ${sellerId} has no shipping option`)
    }
  }

  const { data: shipRows } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "seller.id",
      "service_zone.id",
      "service_zone.fulfillment_set_id",
    ],
    filters: { id: shippingOptionId },
  })
  const shippingOption = shipRows[0] as
    | {
        id: string
        seller?: { id: string } | null
        service_zone?: { id?: string; fulfillment_set_id?: string } | null
      }
    | undefined
  if (!shippingOption) {
    throw new Error(`Shipping option ${shippingOptionId} not found`)
  }
  if (shippingOption.seller?.id !== sellerId) {
    throw new Error(
      `Shipping option ${shippingOptionId} does not belong to seller ${sellerId}`
    )
  }
  const shippingOptionFulfillmentSetId =
    shippingOption.service_zone?.fulfillment_set_id
  if (!shippingOption.service_zone?.id) {
    throw new Error(`Shipping option ${shippingOptionId} has no service zone`)
  }

  // 2. collect the countries the option's service zone can deliver to
  const [, totalGeoZones] = await fulfillmentModule.listAndCountGeoZones({
    type: "country",
  })
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
      `Shipping option ${shippingOptionId} has no country geo zone to deliver to`
    )
  }

  // 3. find (or extend) a region that covers one of those countries
  const regions = await regionModule.listRegions({}, { relations: ["countries"] })
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
    const usedCountries = new Set<string>()
    for (const r of regions) {
      for (const c of r.countries ?? []) {
        if (c.iso_2) usedCountries.add(c.iso_2.toLowerCase())
      }
    }
    const candidate = optionCountries.find((c) => !usedCountries.has(c))
    if (!candidate) {
      throw new Error(
        `Every country in shipping option ${shippingOptionId} is already assigned to another region`
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
  }

  // 4. ensure a sales channel reaches the seller's fulfillment set
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
    if (sellerStockLocationId) {
      try {
        await link.create({
          [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannel.id },
          [Modules.STOCK_LOCATION]: {
            stock_location_id: sellerStockLocationId,
          },
        })
      } catch (e: unknown) {
        if (!(e instanceof Error && /already exists/i.test(e.message))) {
          throw e
        }
      }
    }
  }

  // 5. seller offers pointing at a published variant
  const { data: offerRows } = await query.graph({
    entity: "offer",
    fields: ["id", "seller_id", "variant_id"],
    filters: { seller_id: sellerId },
  })
  const offers = (offerRows as unknown as OfferRow[]).filter(
    (o) => typeof o.variant_id === "string" && o.variant_id.length > 0
  )
  if (!offers.length) {
    throw new Error(`Seller ${sellerId} has no offers with a variant`)
  }
  const variants = await productModule.listProductVariants(
    { id: offers.map((o) => o.variant_id) },
    { relations: ["product"], take: null }
  )
  const variantsById = new Map(variants.map((v) => [v.id, v]))
  const publishedOffers = offers.filter(
    (o) => variantsById.get(o.variant_id)?.product?.status === "published"
  )
  if (!publishedOffers.length) {
    throw new Error(
      `Seller ${sellerId} has offers but none point to a published product variant`
    )
  }

  // 6. guest cart
  const address = {
    first_name: "Seed",
    last_name: "Buyer",
    address_1: "123 Seed St",
    city: "Seed City",
    country_code: optionCountry,
    postal_code: "00000",
  }
  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      email,
      region_id: region.id,
      sales_channel_id: salesChannel.id,
      currency_code: region.currency_code,
      shipping_address: address,
      billing_address: address,
    },
  })

  // 7. line items (one workflow run — re-running per item re-fires the
  // payment-collection hook and throws on the already-linked offer)
  await addToCartWorkflow(container).run({
    input: {
      cart_id: cart.id,
      items: publishedOffers.map(
        (offer) =>
          ({
            variant_id: offer.variant_id,
            quantity: 1,
            offer_id: offer.id,
            metadata: { offer_id: offer.id },
          }) as never
      ),
    },
  })

  // 8. seller shipping method
  await addSellerShippingMethodToCartWorkflow(container).run({
    input: { cart_id: cart.id, options: [{ id: shippingOptionId }] },
  })

  // 9. payment collection + system session
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

  // 10. complete → split into per-seller orders
  const { result, errors } = await completeCartWithSplitOrdersWorkflow(
    container
  ).run({ input: { cart_id: cart.id }, throwOnError: false })
  if (errors?.length) {
    throw errors[0].error
  }
  const orderGroupId = result?.order_group_id
  if (!orderGroupId) {
    throw new Error("Cart completion did not return an order group id")
  }

  const { data: orderGroups } = await query.graph({
    entity: "order_group",
    fields: ["id", "orders.id", "orders.display_id"],
    filters: { id: orderGroupId },
  })
  const orders: SeededOrder[] = (orderGroups[0]?.orders ?? [])
    .filter((o) => Boolean(o?.id))
    .map((o) => ({ id: o!.id, display_id: o!.display_id }))
  logger.info(
    `Seeded ${orders.length} order(s) for seller ${sellerId}: ${orders
      .map((o) => `#${o.display_id}`)
      .join(", ")}`
  )
  return orders
}
