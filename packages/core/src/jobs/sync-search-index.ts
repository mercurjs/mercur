import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ProductStatus } from "@mercurjs/types"

import { syncSearchProducts } from "../utils/search/sync-search-products"

const BATCH_SIZE = 200

export default async function syncSearchIndexJob(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  let offset = 0
  for (;;) {
    const { data: products, metadata } = await query.graph({
      entity: "product",
      fields: ["id"],
      filters: { status: ProductStatus.PUBLISHED },
      pagination: { skip: offset, take: BATCH_SIZE },
    })

    if (!products.length) {
      break
    }

    await syncSearchProducts(
      container,
      (products as { id: string }[]).map((p) => p.id)
    )

    offset += BATCH_SIZE
    if (offset >= (metadata?.count ?? 0)) {
      break
    }
  }
}

export const config = {
  name: "sync-search-index",
  schedule: "0 * * * *",
}
