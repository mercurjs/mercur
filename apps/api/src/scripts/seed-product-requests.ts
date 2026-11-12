import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@mercurjs/core/workflows"
import {
  MercurModules,
  ProductChangeActionType,
  ProductChangeStatus,
  ProductStatus,
  SellerStatus,
} from "@mercurjs/types"

/**
 * Fill the admin Products → Requests with work for the operator: a few
 * vendor-submitted (proposed) products per store plus pending edit and
 * deletion requests on products those stores already sell.
 *
 * Run:
 *   bun --cwd apps/api run medusa exec ./src/scripts/seed-product-requests.ts
 */
const PROPOSED_PER_SELLER = 2

const PROPOSALS = [
  { title: "Linen Lounge Chair", description: "Handmade oak frame with washed linen cushions." },
  { title: "Ceramic Pour-Over Set", description: "Dripper, carafe and two cups in matte stoneware." },
  { title: "Merino Travel Blanket", description: "Lightweight, packs into its own pouch." },
  { title: "Brass Desk Lamp", description: "Adjustable arm, warm dimmable LED." },
  { title: "Recycled Canvas Tote", description: "Heavy-duty canvas, fits a 15-inch laptop." },
  { title: "Walnut Serving Board", description: "End-grain walnut with a leather hanging loop." },
]

type SellerRow = { id: string; name: string }
type ProductRow = {
  id: string
  title: string
  description: string | null
  status: string
  sellers?: SellerRow[] | null
}

export default async function seedProductRequests({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productEdit = container.resolve(MercurModules.PRODUCT_EDIT)

  const { data: sellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { status: SellerStatus.OPEN },
  })
  const stores = (sellers.length ? sellers : (await query.graph({
    entity: "seller",
    fields: ["id", "name"],
  })).data) as SellerRow[]

  if (!stores.length) {
    logger.warn("No sellers found. Seed the marketplace first (bun run seed).")
    return
  }

  let proposalIndex = 0
  for (const store of stores.slice(0, 3)) {
    const products = Array.from({ length: PROPOSED_PER_SELLER }, () => {
      const proposal = PROPOSALS[proposalIndex++ % PROPOSALS.length]
      return {
        title: `${proposal.title} by ${store.name}`,
        description: proposal.description,
        status: ProductStatus.PROPOSED,
        seller_ids: [store.id],
      }
    })

    await createProductsWorkflow(container).run({
      input: { products, created_by: store.id },
    })
    logger.info(`${store.name}: submitted ${products.length} proposed products`)
  }

  const { data: published } = await query.graph({
    entity: "product",
    fields: ["id", "title", "description", "status", "sellers.id", "sellers.name"],
    filters: { status: ProductStatus.PUBLISHED },
    pagination: { take: 50, skip: 0 },
  })

  const { data: pending } = await query.graph({
    entity: "product_change",
    fields: ["product_id"],
    filters: { status: ProductChangeStatus.PENDING },
  })
  const alreadyPending = new Set(pending.map((c) => c.product_id))

  const candidates = (published as ProductRow[]).filter(
    (p) => p.sellers?.length && !alreadyPending.has(p.id),
  )

  const seedChange = async (
    product: ProductRow,
    actions: Array<{
      action: ProductChangeActionType
      details: Record<string, unknown>
    }>,
  ) => {
    const seller = product.sellers![0]
    const [change] = await productEdit.createProductChanges([
      {
        product_id: product.id,
        created_by: seller.id,
        status: ProductChangeStatus.PENDING,
      },
    ])
    await productEdit.createProductChangeActions(
      actions.map((a) => ({
        product_change_id: change.id,
        product_id: product.id,
        action: a.action,
        details: a.details,
      })),
    )
    return seller
  }

  const [first, second, third] = candidates
  if (first) {
    const seller = await seedChange(first, [
      {
        action: ProductChangeActionType.UPDATE,
        details: {
          field: "title",
          value: `${first.title} (2026 edition)`,
          previous_value: first.title,
        },
      },
      {
        action: ProductChangeActionType.UPDATE,
        details: {
          field: "description",
          value: `${first.description ?? ""} Now with a two-year warranty.`.trim(),
          previous_value: first.description,
        },
      },
    ])
    logger.info(`${seller.name}: requested an update on "${first.title}"`)
  }
  if (second) {
    const seller = await seedChange(second, [
      {
        action: ProductChangeActionType.UPDATE,
        details: {
          field: "subtitle",
          value: "Limited run",
          previous_value: null,
        },
      },
    ])
    logger.info(`${seller.name}: requested an update on "${second.title}"`)
  }
  if (third) {
    const seller = await seedChange(third, [
      { action: ProductChangeActionType.PRODUCT_DELETE, details: {} },
    ])
    logger.info(`${seller.name}: requested deletion of "${third.title}"`)
  }

  if (!first) {
    logger.warn("No published products with a store link found; skipped edit requests.")
  }
}
