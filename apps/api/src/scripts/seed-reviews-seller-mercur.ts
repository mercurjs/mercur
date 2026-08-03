import { ExecArgs } from "@medusajs/framework/types"
import { Link } from "@medusajs/framework/modules-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MercurModules } from "@mercurjs/types"

/**
 * Seed seller reviews for the demo seller behind member `seller@mercur.dev`.
 *
 * Only seller-reference reviews are seeded: the vendor panel surfaces reviews
 * through the seller↔review link, so product reviews would never show there.
 *
 * Bypasses `createReviewWorkflow` (which requires a real, customer-owned order
 * and enforces one-review-per-order/reference) and writes directly through the
 * review service, wiring the customer + seller remote links by hand.
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/seed-reviews-seller-mercur.ts
 */

const SELLER_MEMBER_EMAIL = "seller@mercur.dev"

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
  {
    rating: 5,
    customer_note: "Best store on the marketplace, hands down.",
    seller_note: "You just made our day — thank you!",
    status: "published",
  },
  {
    rating: 2,
    customer_note: "Item was okay but the follow-up support was lacking.",
    status: "pending",
  },
]

export default async function seedReviewsForMercurSeller({
  container,
}: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve<Link>(ContainerRegistrationKeys.LINK)
  const reviewService = container.resolve<ReviewModuleService>(
    MercurModules.REVIEW
  )
  const customerModule = container.resolve(Modules.CUSTOMER)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { members: { email: SELLER_MEMBER_EMAIL } },
  })

  const seller = sellers[0]

  if (!seller) {
    logger.error(
      `No seller found for member email "${SELLER_MEMBER_EMAIL}". Aborting.`
    )
    return
  }

  logger.info(`Seeding reviews for seller "${seller.name}" (${seller.id})`)

  let { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id"],
    pagination: { take: 5, skip: 0 },
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

  const pickCustomer = (i: number) => customers[i % customers.length].id

  let created = 0

  for (let i = 0; i < SELLER_REVIEWS.length; i++) {
    const seed = SELLER_REVIEWS[i]

    const review = await reviewService.createReviews({
      reference: "seller",
      rating: seed.rating,
      customer_note: seed.customer_note,
      seller_note: seed.seller_note ?? null,
      status: seed.status ?? "pending",
    })

    await link.create([
      {
        [MercurModules.SELLER]: { seller_id: seller.id },
        [MercurModules.REVIEW]: { review_id: review.id },
      },
      {
        [Modules.CUSTOMER]: { customer_id: pickCustomer(i) },
        [MercurModules.REVIEW]: { review_id: review.id },
      },
    ])

    created++
    logger.info(`Seeded seller review (${seed.rating}★) — ${seed.status}`)
  }

  logger.info(
    `Done. Created ${created} review(s) for seller "${seller.name}".`
  )
}
