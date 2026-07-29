import { ExecArgs } from "@medusajs/framework/types"
import { Link } from "@medusajs/framework/modules-sdk"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

import { seedSellerOrder, SeededOrder } from "./lib/seed-seller-order"

/**
 * Seed customer reviews for existing products and sellers.
 *
 * Bypasses `createReviewWorkflow` on purpose: that workflow requires a real
 * order that belongs to the reviewing customer and enforces one-review-per
 * order/reference. For demo data we create reviews directly through the review
 * service and wire the remote links (customer + product/seller) by hand.
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/seed-reviews.ts
 */

type ReviewSeed = {
  rating: number
  customer_note: string
  seller_note?: string
  status?: "pending" | "published" | "rejected"
}

type CreateReviewInput = {
  reference: "product" | "seller"
  rating: number
  customer_note: string | null
  seller_note: string | null
  status: "pending" | "published" | "rejected"
}

type ReviewModuleService = {
  createReviews(data: CreateReviewInput): Promise<{ id: string }>
}

const PRODUCT_REVIEWS: ReviewSeed[] = [
  {
    rating: 5,
    customer_note: "Exactly as described, arrived quickly and the quality is great.",
    seller_note: "Thanks so much for the kind words — enjoy!",
    status: "published",
  },
  {
    rating: 4,
    customer_note: "Really happy with it, only wish the sizing ran a touch larger.",
    status: "published",
  },
  {
    rating: 3,
    customer_note: "Decent product but shipping took longer than expected.",
    status: "pending",
  },
  {
    rating: 5,
    customer_note: "My second purchase from this catalog. Consistently good.",
    status: "published",
  },
  {
    rating: 2,
    customer_note: "Not quite what I expected from the photos.",
    status: "rejected",
  },
]

const SELLER_REVIEWS: ReviewSeed[] = [
  {
    rating: 5,
    customer_note: "Fantastic seller — responsive and fast fulfillment.",
    seller_note: "Appreciate it! Hope to see you again.",
    status: "published",
  },
  {
    rating: 4,
    customer_note: "Good communication and packaging. Would buy again.",
    status: "published",
  },
  {
    rating: 3,
    customer_note: "Order was fine but replies were a little slow.",
    status: "pending",
  },
]

export default async function seedReviews({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
  const reviewService = container.resolve<ReviewModuleService>(
    MercurModules.REVIEW
  )

  const customerModule = container.resolve(Modules.CUSTOMER)

  let { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id"],
    pagination: { take: 10, skip: 0 },
  })

  if (!customers.length) {
    logger.info("No customers found, creating demo customers...")
    const created = await customerModule.createCustomers([
      { email: "ava.reviewer@mercur.dev", first_name: "Ava", last_name: "Nguyen" },
      { email: "liam.reviewer@mercur.dev", first_name: "Liam", last_name: "Meyer" },
      { email: "sofia.reviewer@mercur.dev", first_name: "Sofia", last_name: "Rossi" },
    ])
    customers = created.map((c) => ({ id: c.id }))
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
    filters: { status: "published" },
    pagination: { take: PRODUCT_REVIEWS.length, skip: 0 },
  })

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    pagination: { take: SELLER_REVIEWS.length, skip: 0 },
  })

  let { data: orders } = await query.graph({
    entity: "order",
    fields: ["id"],
    pagination: { take: 10, skip: 0 },
  })

  // Reviews must reference the order the customer bought from. When the demo
  // DB has no orders yet, drive the real store checkout (per seller) so every
  // review can be linked to a genuine order. `ordersBySeller` lets a seller
  // review point at an order that actually belongs to that seller.
  const ordersBySeller = new Map<string, string>()

  if (!orders.length) {
    logger.info("No orders found, seeding orders per seller via checkout...")
    const seeded: SeededOrder[] = []
    for (const seller of sellers) {
      try {
        const sellerOrders = await seedSellerOrder(container, {
          sellerId: seller.id,
        })
        if (sellerOrders[0]) {
          ordersBySeller.set(seller.id, sellerOrders[0].id)
        }
        seeded.push(...sellerOrders)
      } catch (e) {
        logger.warn(
          `Skipped order seeding for seller ${seller.id}: ${
            e instanceof Error ? e.message : e
          }`
        )
      }
    }
    orders = seeded.map((o) => ({ id: o.id }))
  }

  const pickCustomer = (i: number) => customers[i % customers.length].id
  const pickOrder = (i: number) =>
    orders.length ? orders[i % orders.length].id : undefined

  let created = 0

  for (let i = 0; i < products.length; i++) {
    const seed = PRODUCT_REVIEWS[i]
    const product = products[i]

    const review = await reviewService.createReviews({
      reference: "product",
      rating: seed.rating,
      customer_note: seed.customer_note,
      seller_note: seed.seller_note ?? null,
      status: seed.status ?? "pending",
    })

    const productLinks: Record<string, Record<string, string>>[] = [
      {
        [Modules.PRODUCT]: { product_id: product.id },
        [MercurModules.REVIEW]: { review_id: review.id },
      },
      {
        [Modules.CUSTOMER]: { customer_id: pickCustomer(i) },
        [MercurModules.REVIEW]: { review_id: review.id },
      },
    ]

    const productOrderId = pickOrder(i)
    if (productOrderId) {
      productLinks.push({
        [Modules.ORDER]: { order_id: productOrderId },
        [MercurModules.REVIEW]: { review_id: review.id },
      })
    }

    await link.create(productLinks)

    created++
    logger.info(`Seeded product review for "${product.title}" (${seed.rating}★)`)
  }

  for (let i = 0; i < sellers.length; i++) {
    const seed = SELLER_REVIEWS[i]
    const seller = sellers[i]

    const review = await reviewService.createReviews({
      reference: "seller",
      rating: seed.rating,
      customer_note: seed.customer_note,
      seller_note: seed.seller_note ?? null,
      status: seed.status ?? "pending",
    })

    const sellerLinks: Record<string, Record<string, string>>[] = [
      {
        [MercurModules.SELLER]: { seller_id: seller.id },
        [MercurModules.REVIEW]: { review_id: review.id },
      },
      {
        [Modules.CUSTOMER]: { customer_id: pickCustomer(i) },
        [MercurModules.REVIEW]: { review_id: review.id },
      },
    ]

    const sellerOrderId = ordersBySeller.get(seller.id) ?? pickOrder(i)
    if (sellerOrderId) {
      sellerLinks.push({
        [Modules.ORDER]: { order_id: sellerOrderId },
        [MercurModules.REVIEW]: { review_id: review.id },
      })
    }

    await link.create(sellerLinks)

    created++
    logger.info(`Seeded seller review for "${seller.name}" (${seed.rating}★)`)
  }

  logger.info(`Done. Created ${created} review(s).`)
}
